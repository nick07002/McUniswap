const { ethers } = require('ethers');
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json');
const { getPoolImmutables, getPoolState } = require('./helpers');
const ERC20ABI = require('./abi.json');

require('dotenv').config();

// Constants
const {
  INFURA_URL_TESTNET,
  WALLET_ADDRESS,
  WALLET_SECRET,
} = process.env;
const POOL_ADDRESS = '0x4d1892f15B03db24b55E73F9801826a56d6f0755'; // UNI/WETH
const SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

// Set up provider and wallet
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET);
const wallet = new ethers.Wallet(WALLET_SECRET);
const connectedWallet = wallet.connect(provider);

// Set up contracts
const poolContract = new ethers.Contract(POOL_ADDRESS, IUniswapV3PoolABI, provider);
const swapRouterContract = new ethers.Contract(SWAP_ROUTER_ADDRESS, SwapRouterABI, provider);

// Run the main program
async function main() {
  const immutables = await getPoolImmutables(poolContract);
  const state = await getPoolState(poolContract);

  const inputAmount = ethers.utils.parseUnits('0.001', 18);  // 0.001 ETH to Wei
  const approvalAmount = inputAmount.mul(100000);  // Multiply by 100000

  const tokenContract = new ethers.Contract(immutables.token0, ERC20ABI, provider);
  const approvalResponse = await tokenContract.connect(connectedWallet).approve(SWAP_ROUTER_ADDRESS, approvalAmount);

  console.log('approvalResponse:', approvalResponse);
  console.log('fee:', immutables.fee);

  const params = {
    tokenIn: immutables.token1,
    tokenOut: immutables.token0,
    fee: immutables.fee,
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + (60 * 10),
    amountIn: inputAmount,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  }

  const transaction = await swapRouterContract.connect(connectedWallet).exactInputSingle(params, {
    gasLimit: ethers.utils.hexlify(1000000),
  });

  console.log(transaction);
}

main();
