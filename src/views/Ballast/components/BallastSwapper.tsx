import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Config from 'bao/lib/config'
import BigNumber from 'bignumber.js'
import { BalanceInput } from 'components/Input'
import { SpinnerLoader } from 'components/Loader'
import Tooltipped from 'components/Tooltipped'
import useBao from 'hooks/base/useBao'
import useTokenBalance from 'hooks/base/useTokenBalance'
import useTransactionProvider from 'hooks/base/useTransactionProvider'
import React, { useCallback, useEffect, useState } from 'react'
import { Badge, Card } from 'react-bootstrap'
import styled from 'styled-components'
import Multicall from 'utils/multicall'
import { decimate, getDisplayBalance } from 'utils/numberFormat'
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

	// TODO: Move this to a hook ?
	const fetchBallastInfo = useCallback(async () => {
		const ballastContract = bao.getContract('stabilizer')
		const ballastQueries = Multicall.createCallContext([
			{
				ref: 'Ballast',
				contract: ballastContract,
				calls: [
					{ method: 'supplyCap' },
					{ method: 'buyFee' },
					{ method: 'sellFee' },
					{ method: 'FEE_DENOMINATOR' },
				],
			},
			{
				ref: 'DAI',
				contract: bao.getNewContract('erc20.json', Config.addressMap.DAI),
				calls: [
					{ method: 'balanceOf', params: [ballastContract.options.address] },
				],
			},
		])
		const { Ballast: ballastRes, DAI: daiRes } = Multicall.parseCallResults(
			await bao.multicall.call(ballastQueries),
		)

		setSupplyCap(new BigNumber(ballastRes[0].values[0].hex))
		setFees({
			buy: new BigNumber(ballastRes[1].values[0].hex),
			sell: new BigNumber(ballastRes[2].values[0].hex),
			denominator: new BigNumber(ballastRes[3].values[0].hex),
		})
		setReserves(new BigNumber(daiRes[0].values[0].hex))
	}, [bao, transactions])

	useEffect(() => {
		if (!bao) return

		fetchBallastInfo()
	}, [bao, transactions])

	const daiInput = (
		<>
			<label>
				<FontAwesomeIcon icon="long-arrow-alt-right" /> Balance:{' '}
				{getDisplayBalance(daiBalance).toString()} DAI
				<span>
					Reserves:{' '}
					{reserves ? (
						getDisplayBalance(reserves).toString()
					) : (
						<SpinnerLoader />
					)}{' '}
					DAI
				</span>
			</label>
			<BalanceInput
				onMaxClick={() => setInputVal(decimate(daiBalance).toString())}
				onChange={(e) => setInputVal(e.currentTarget.value)}
				value={
					swapDirection && fees && !new BigNumber(inputVal).isNaN()
						? new BigNumber(inputVal)
								.times(
									new BigNumber(1).minus(fees['sell'].div(fees['denominator'])),
								)
								.toString()
						: inputVal
				}
				disabled={swapDirection}
			/>
		</>
	)

	const baoUSDInput = (
		<>
			<label>
				<FontAwesomeIcon icon="long-arrow-alt-right" /> Balance:{' '}
				{getDisplayBalance(baoUSDBalance).toString()} BaoUSD
				<span>
					Mint Limit:{' '}
					{supplyCap ? (
						getDisplayBalance(supplyCap).toString()
					) : (
						<SpinnerLoader />
					)}{' '}
					BaoUSD
				</span>
			</label>
			<BalanceInput
				onMaxClick={() => setInputVal(decimate(baoUSDBalance).toString())}
				onChange={(e) => setInputVal(e.currentTarget.value)}
				value={
					!swapDirection && fees && !new BigNumber(inputVal).isNaN()
						? new BigNumber(inputVal)
								.times(
									new BigNumber(1).minus(fees['buy'].div(fees['denominator'])),
								)
								.toString()
						: inputVal
				}
				disabled={!swapDirection}
			/>
		</>
	)

	return (
		<BallastSwapCard>
			<h2 style={{ textAlign: 'center' }}>
				<Tooltipped content="The Ballast is used to mint BaoUSD with DAI or to redeem DAI for BaoUSD at a 1:1 rate (not including fees).">
					<a>
						<FontAwesomeIcon icon="ship" />
					</a>
				</Tooltipped>
			</h2>
			{swapDirection ? baoUSDInput : daiInput}
			<SwapDirection onClick={() => setSwapDirection(!swapDirection)}>
				<SwapDirectionBadge pill>
					<FontAwesomeIcon icon="sync" />
					{' - '}
					Fee:{' '}
					{fees ? (
						`${fees[swapDirection ? 'sell' : 'buy']
							.div(fees['denominator'])
							.times(100)
							.toString()}%`
					) : (
						<SpinnerLoader />
					)}
				</SwapDirectionBadge>
			</SwapDirection>
			{swapDirection ? daiInput : baoUSDInput}
			<br />
			<BallastButton
				swapDirection={swapDirection}
				inputVal={inputVal}
				maxValues={{ buy: decimate(daiBalance), sell: decimate(baoUSDBalance) }}
				supplyCap={supplyCap}
				reserves={reserves}
			/>
		</BallastSwapCard>
	)
}

const BallastSwapCard = styled(Card)`
	width: 60%;
	padding: 25px;
	margin: auto;
	background-color: ${(props) => props.theme.color.primary[100]};
	border-radius: ${(props) => props.theme.borderRadius}px;
	border: ${(props) => props.theme.border.default};

	label > span {
		float: right;
		margin-bottom: 0.25rem;
		color: ${(props) => props.theme.color.text[200]};
	}
`

const SwapDirection = styled.a`
	text-align: center;
	display: block;
	margin-top: 1em;
	color: ${(props) => props.theme.color.text[200]};
	user-select: none;
	transition: 200ms;

	&:hover {
		cursor: pointer;
	}
`

const SwapDirectionBadge = styled(Badge)`
	background-color: ${(props) => props.theme.color.primary[200]} !important;
	color: ${(props) => props.theme.color.text[100]};
	border: ${(props) => props.theme.border.default};
	
	&:hover {
		background-color: ${(props) => props.theme.color.primary[300]} !important;
	}
`

export default BallastSwapper
