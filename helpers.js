exports.getPoolImmutables = async (poolContract) => {
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee()
  ])

  // Return the object directly
  return { token0, token1, fee };
}

exports.getPoolState = async (poolContract) => {
  const slot = await poolContract.slot0();
  
  // Return the object directly
  return { sqrtPriceX96: slot[0] };
}
