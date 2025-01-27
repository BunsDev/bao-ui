import { useContext } from 'react'

import { SupportedMarket } from '@/bao/lib/types'
import { Context as MarketsContext } from '@/contexts/Markets'

const useMarket = (id: string): SupportedMarket => {
	const { markets } = useContext(MarketsContext)
	return markets.find(market => market.underlyingSymbol === id)
}

export default useMarket
