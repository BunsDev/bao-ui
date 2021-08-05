import { useEffect, useState } from 'react'
import { Nest, NestComponent } from '../contexts/Nests/types'
import { useWallet } from 'use-wallet'
import { getBalance, getDecimals } from '../utils/erc20'
import { provider } from 'web3-core'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import { getBalanceNumber } from '../utils/formatBalance'
import { getSubgraphPriceHistoryMultiple } from '../utils/graph'

const useComposition = (nest: Nest) => {
  const { ethereum }: { ethereum: provider } = useWallet()
  const [composition, setComposition] = useState<Array<NestComponent> | undefined>()

  useEffect(() => {
    if (!nest || !nest.composition) return

    getSubgraphPriceHistoryMultiple(_.map(nest.composition, component => component.symbol)).then(async (prices: any) => {
      const res = await Promise.all(nest.composition.map(async (component: any) => {
        const [coinGeckoInfo, componentBalance, tokenDecimals]: any = await Promise.all([
          (await fetch(`https://api.coingecko.com/api/v3/coins/${component.coingeckoId}`)).json(),
          getBalance(ethereum, component.address, nest.nestTokenAddress),
          getDecimals(ethereum, component.address),
        ])

        return {
          ...component,
          balance: new BigNumber(componentBalance),
          balanceDecimals: parseInt(tokenDecimals),
          imageUrl: coinGeckoInfo.image ? coinGeckoInfo.image.large : 'NOT_FOUND',
          price: new BigNumber(_.find(prices.tokens, { symbol: component.symbol }).dayData[0].priceUSD),
        }
      }))

      // Calculate total USD value of all component tokens in nest contract
      const totalUsd = _.sum(_.map(res, component => {
        if (component.price)
          return component.price.times(getBalanceNumber(component.balance, component.balanceDecimals)).toNumber()
      }))

      // Calculate percentages of component tokens in nest contract
      _.each(res, component => {
        if (component.price)
          component.percentage = component.price
            .times(getBalanceNumber(component.balance, component.balanceDecimals))
            .div(totalUsd)
            .times(100)
            .toFixed(2)
      })

      setComposition(res)
    })
  }, [nest])

  return composition
}

export default useComposition
