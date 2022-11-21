import { faShip, faSync } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { BigNumber } from 'ethers'
import Image from 'next/future/image'
import React, { useCallback, useEffect, useState } from 'react'
import { isDesktop } from 'react-device-detect'

import Config from '@/bao/lib/config'
import Card from '@/components/Card'
import Input from '@/components/Input'
import Loader from '@/components/Loader'
import PageHeader from '@/components/PageHeader'
import Tooltipped from '@/components/Tooltipped'
import Typography from '@/components/Typography'
import useBao from '@/hooks/base/useBao'
import useTokenBalance from '@/hooks/base/useTokenBalance'
import useTransactionProvider from '@/hooks/base/useTransactionProvider'
import Multicall from '@/utils/multicall'
import { exponentiate, getDisplayBalance } from '@/utils/numberFormat'

import useContract from '@/hooks/base/useContract'
import type { Dai, Stabilizer } from '@/typechain/index'

import { formatEther, formatUnits } from 'ethers/lib/utils'
import BallastButton from './BallastButton'

const BallastSwapper: React.FC = () => {
	const bao = useBao()
	const { transactions } = useTransactionProvider()
	const [swapDirection, setSwapDirection] = useState(false) // false = DAI->baoUSD | true = baoUSD->DAI
	const [inputVal, setInputVal] = useState('')

	const [reserves, setReserves] = useState<BigNumber | undefined>()
	const [supplyCap, setSupplyCap] = useState<BigNumber | undefined>()
	const [fees, setFees] = useState<{ [key: string]: BigNumber } | undefined>()

	const daiBalance = useTokenBalance(Config.addressMap.DAI)
	const baoUSDBalance = useTokenBalance(Config.addressMap.baoUSD)

	const ballast = useContract<Stabilizer>('Stabilizer')
	const dai = useContract<Dai>('Dai')

	// TODO: Move this to a hook ?
	const fetchBallastInfo = useCallback(async () => {
		const ballastQueries = Multicall.createCallContext([
			{
				ref: 'Ballast',
				contract: ballast,
				calls: [{ method: 'supplyCap' }, { method: 'buyFee' }, { method: 'sellFee' }, { method: 'FEE_DENOMINATOR' }],
			},
			{
				ref: 'DAI',
				contract: dai,
				calls: [{ method: 'balanceOf', params: [ballast.address] }],
			},
		])
		const { Ballast: ballastRes, DAI: daiRes } = Multicall.parseCallResults(await bao.multicall.call(ballastQueries))

		setSupplyCap(BigNumber.from(ballastRes[0].values[0]))
		setFees({
			buy: BigNumber.from(ballastRes[1].values[0]),
			sell: BigNumber.from(ballastRes[2].values[0]),
			denominator: BigNumber.from(ballastRes[3].values[0]),
		})
		setReserves(BigNumber.from(daiRes[0].values[0]))
	}, [bao, ballast, dai])

	useEffect(() => {
		if (!bao || !ballast || !dai) return
		fetchBallastInfo()
	}, [bao, ballast, dai, fetchBallastInfo, transactions])

	const daiInput = (
		<>
			<Typography variant='sm' className='float-left mb-1'>
				Balance: {getDisplayBalance(daiBalance)} DAI
			</Typography>
			<Typography variant='sm' className='float-right mb-1 text-text-200'>
				Reserves: {reserves ? getDisplayBalance(reserves).toString() : <Loader />}{' '}
			</Typography>
			<Input
				onSelectMax={() => setInputVal(formatEther(daiBalance).toString())}
				onChange={(e: { currentTarget: { value: React.SetStateAction<string> } }) => setInputVal(e.currentTarget.value)}
				// Fee calculation not ideal, fix.
				value={swapDirection && fees && inputVal ? (parseFloat(inputVal) - parseFloat(inputVal) * (100 / 10000)).toString() : inputVal}
				disabled={swapDirection}
				label={
					<div className='flex flex-row items-center pl-2 pr-4'>
						<div className='flex w-6 justify-center'>
							<Image src='/images/tokens/DAI.png' height={32} width={32} alt='baoUSD' />
						</div>
					</div>
				}
			/>
		</>
	)

	const baoUSDInput = (
		<>
			<Typography variant='sm' className='float-left mb-1'>
				Balance: {getDisplayBalance(baoUSDBalance).toString()} baoUSD
			</Typography>
			<Typography variant='sm' className='float-right mb-1 text-text-200'>
				Mint Limit: {supplyCap ? getDisplayBalance(supplyCap).toString() : <Loader />}{' '}
			</Typography>
			<Input
				onSelectMax={() => setInputVal(formatEther(baoUSDBalance).toString())}
				onChange={(e: { currentTarget: { value: React.SetStateAction<string> } }) => setInputVal(e.currentTarget.value)}
				// Fee calculation not ideal, fix.
				value={!swapDirection && fees && inputVal ? (parseFloat(inputVal) - parseFloat(inputVal) * (100 / 10000)).toString() : inputVal}
				disabled={!swapDirection}
				label={
					<div className='flex flex-row items-center pl-2 pr-4'>
						<div className='flex w-6 justify-center'>
							<Image src='/images/tokens/baoUSD.png' height={32} width={32} alt='baoUSD' />
						</div>
					</div>
				}
			/>
		</>
	)
	console.log(fees && 'Buy Fee', fees?.buy.toString(), 'Sell Fee', fees?.sell.toString(), 'Denominator', fees?.denominator.toString())
	console.log('Fee', 100 / 10000)

	return (
		<>
			<PageHeader title='Ballast' />
			<Card className={`${isDesktop && 'mx-auto max-w-[80%]'}`}>
				<Card.Header
					header={
						<Tooltipped content='The Ballast is used to mint baoUSD with DAI or to redeem DAI for baoUSD at a 1:1 rate (not including fees).'>
							<a>
								<FontAwesomeIcon className='text-4xl' icon={faShip} />
							</a>
						</Tooltipped>
					}
				/>
				<Card.Body>
					{swapDirection ? baoUSDInput : daiInput}
					<div className='mt-4 block select-none text-center'>
						<span
							className='mb-2 rounded-full border-none bg-primary-300 p-2 text-lg hover:cursor-pointer hover:bg-primary-400'
							onClick={() => setSwapDirection(!swapDirection)}
						>
							<FontAwesomeIcon icon={faSync} size='sm' className='m-auto' />
							{' - '}
							Fee: {fees ? `${(100 / 10000) * 100}%` : <Loader />}
						</span>
					</div>
					{swapDirection ? daiInput : baoUSDInput}
					<div className='h-4' />
				</Card.Body>
				<Card.Actions>
					<BallastButton
						swapDirection={swapDirection}
						inputVal={inputVal}
						maxValues={{
							buy: daiBalance,
							sell: baoUSDBalance,
						}}
						supplyCap={supplyCap}
						reserves={reserves}
					/>
				</Card.Actions>
			</Card>
		</>
	)
}

export default BallastSwapper
