import useContract from '@/hooks/base/useContract'
import type { GaugeController } from '@/typechain/index'
import { providerKey } from '@/utils/index'
import { useQuery } from '@tanstack/react-query'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import { useBlockUpdater } from '../base/useBlock'
import { useTxReceiptUpdater } from '../base/useTransactionProvider'

const useTotalWeight = () => {
	const gaugeController = useContract<GaugeController>('GaugeController')
	const { library, account, chainId } = useWeb3React()
	const enabled = !!chainId

	const { data: totalWeight, refetch } = useQuery(
		['gaugeController.get_total_weight', providerKey(library, account, chainId)],
		async () => {
			const weight = await gaugeController.get_total_weight()
			return weight
		},
		{
			enabled,
			refetchOnReconnect: true,
			placeholderData: BigNumber.from(0),
		},
	)

	const _refetch = () => {
		if (enabled) setTimeout(refetch, 0)
	}

	useTxReceiptUpdater(_refetch)
	useBlockUpdater(_refetch, 10)

	return totalWeight
}

export default useTotalWeight
