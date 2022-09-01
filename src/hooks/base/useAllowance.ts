import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'bignumber.js'
import { useCallback, useEffect, useState } from 'react'

import { getAllowance } from '@/utils/erc20'

import useBao from './useBao'
import useTransactionProvider from './useTransactionProvider'

const useAllowance = (tokenAddress: string, spenderAddress: string) => {
	const { account } = useWeb3React()
	const bao = useBao()
	const { transactions } = useTransactionProvider()

	const [allowance, setAllowance] = useState<BigNumber | undefined>()

	const _getAllowance: any = useCallback(async () => {
		try {
			const tokenContract = bao.getNewContract('erc20.json', tokenAddress)
			const _allowance = await getAllowance(tokenContract, account, spenderAddress)
			setAllowance(new BigNumber(_allowance))
		} catch (e) {
			setAllowance(new BigNumber(0))
		}
	}, [bao, account, tokenAddress, spenderAddress, transactions])

	useEffect(() => {
		_getAllowance()
	}, [bao, account, tokenAddress, spenderAddress, transactions])

	return allowance
}

export default useAllowance
