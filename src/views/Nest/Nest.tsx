import React, { useEffect, useMemo, useState } from 'react'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import { provider } from 'web3-core'
import Spacer from '../../components/Spacer'
import Button from '../../components/Button'
import IssueModal from './components/IssueModal'
import RedeemModal from './components/RedeemModal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button as BootButton, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { SpinnerLoader } from '../../components/Loader'
import PieGraph from '../../components/Graphs/PieGraph'
import { ParentSize } from '@visx/responsive'
import AreaGraph from '../../components/Graphs/AreaGraph/AreaGraph'
import { getDisplayBalance } from '../../utils/formatBalance'
import { getContract } from '../../utils/erc20'
import useGraphPriceHistory from '../../hooks/useGraphPriceHistory'
import useComposition from '../../hooks/useComposition'
import useNestRate from '../../hooks/useNestRate'
import useNest from '../../hooks/useNest'
import useTokenBalance from '../../hooks/useTokenBalance'
import useNestRedeem from '../../hooks/useNestRedeem'
import { useWallet } from 'use-wallet'
import useBao from '../../hooks/useBao'
import useModal from '../../hooks/useModal'
import { useParams } from 'react-router-dom'
import {
	NestBox,
	NestCornerButton,
	NestBoxHeader,
	NestText,
	NestHeader,
	NestSubHeader,
	NestList,
	AssetImageContainer,
	Icon,
	NestBoxBreak,
	StatsCard,
	StatsCardHeader,
	StatsCardBody,
	NestStats,
	NestStat,
	NestButtons,
	StyledBadge,
	NestAnalytics,
	NestAnalyticsContainer,
	GraphLabel,
	GraphContainer,
	StyledTable,
	AllocationDisplayPrefs,
} from './styles'
import { Progress } from './components/Progress'

// will replace with nest icons once they're designed
import nestIcon from '../../assets/img/egg.png'

const Nest: React.FC = () => {
	const { nestId }: any = useParams()
	const nest = useNest(nestId)
	const { nid, nestToken, nestTokenAddress, inputTokenAddress, name } = nest
	const composition = useComposition(nest)
	const { wethPerIndex, usdPerIndex } = useNestRate(nestTokenAddress)
	const priceHistory = useGraphPriceHistory(nest)

	const [supply, setSupply] = useState<BigNumber | undefined>()
	const [analyticsOpen, setAnalyticsOpen] = useState(true)
	const [allocationDisplayType, setAllocationDisplayType] = useState(false)

	useEffect(() => {
		window.scrollTo(0, 0)
	}, [])

	const { ethereum } = useWallet()

	const nestContract = useMemo(() => {
		return getContract(ethereum as provider, nestTokenAddress)
	}, [ethereum, nestTokenAddress])

	const inputTokenContract = useMemo(() => {
		return getContract(ethereum as provider, inputTokenAddress)
	}, [ethereum, inputTokenAddress])

	const outputTokenContract = useMemo(() => {
		return getContract(ethereum as provider, nestTokenAddress)
	}, [ethereum, nestTokenAddress])

	const maxAllocationPercentage = useMemo(() => {
		return (
			composition &&
			_.max(
				_.map(composition, (component) =>
					parseFloat(component.percentage.toString()),
				),
			)
		)
	}, [composition])

	const marketCap = useMemo(() => {
		return (
			supply &&
			usdPerIndex &&
			`$${getDisplayBalance(supply.div(10 ** 18).times(usdPerIndex), 0)}`
		)
	}, [supply, usdPerIndex])

	const tokenBalance = useTokenBalance(nestContract.options.address)
	const bao = useBao()

	const _inputToken = inputTokenContract.options.address
	const _outputToken = outputTokenContract.options.address

	const [onPresentDeposit] = useModal(
		<IssueModal
			nestName={nestToken}
			nestAddress={nestTokenAddress}
			inputTokenName="WETH"
			_inputToken={_inputToken}
			_outputToken={_outputToken}
			nestContract={nestContract}
			inputTokenContract={inputTokenContract}
			outputTokenContract={outputTokenContract}
		/>,
	)

	const { onNestRedeem } = useNestRedeem(nid)
	const [onPresentRedeem] = useModal(
		<RedeemModal
			max={tokenBalance}
			onConfirm={onNestRedeem}
			nestName={nestToken}
			nestContract={nestContract}
			nid={nid}
		/>,
	)

	useEffect(() => {
		if (nestContract.options.address)
			nestContract.methods.totalSupply().call().then((_supply: any) => setSupply(new BigNumber(_supply)))
	}, [bao, ethereum])

	return (
		<>
			<NestBox>
				<OverlayTrigger
					overlay={
						<Tooltip id={Math.random().toString()}>
							{analyticsOpen ? 'Hide' : 'View'} Analytics
						</Tooltip>
					}
					placement="bottom"
				>
					<NestCornerButton
						onClick={() => setAnalyticsOpen(!analyticsOpen)}
						aria-controls="analytics-collapse"
						aria-expanded={analyticsOpen}
					>
						<FontAwesomeIcon icon="chart-line" />
					</NestCornerButton>
				</OverlayTrigger>
				<OverlayTrigger
					overlay={
						<Tooltip id={Math.random().toString()}>View Contract</Tooltip>
					}
					placement="bottom"
				>
					<NestCornerButton href={`https://polygonscan.com/address/${nestTokenAddress}`} target='_blank'>
						<FontAwesomeIcon icon="file-contract" />
					</NestCornerButton>
				</OverlayTrigger>
				<NestBoxHeader>
					<Icon src={nestIcon} alt={nestToken} />
					<p>{name}</p>
					<div style={{ width: '70%', margin: '0 auto' }}>
						{!composition ? (
							<SpinnerLoader />
						) : (
							composition.map((component: any) => {
								return (
									<OverlayTrigger
										placement="bottom"
										overlay={
											<Tooltip id={component.symbol}>
												{component.symbol}
											</Tooltip>
										}
										key={component.symbol}
									>
										<AssetImageContainer>
											<img src={component.imageUrl} />
										</AssetImageContainer>
									</OverlayTrigger>
								)
							})
						)}
					</div>
				</NestBoxHeader>
				<NestBoxBreak margin={10} />
				<StatsCard>
					<StatsCardHeader>
						1 {nestToken} ={' '}
						{(wethPerIndex && getDisplayBalance(wethPerIndex, 0)) || (
							<SpinnerLoader />
						)}{' '}
						<FontAwesomeIcon icon={['fab', 'ethereum']} /> = $
						{(usdPerIndex && getDisplayBalance(usdPerIndex, 0)) || (
							<SpinnerLoader />
						)}
					</StatsCardHeader>
					<StatsCardBody>
						<NestStats horizontal>
							<NestStat key={'mkt-cap'}>
								<span>
									<FontAwesomeIcon icon="hand-holding-usd" />
									<br />
									Market Cap
								</span>
								<br />
								<StyledBadge>{marketCap || <SpinnerLoader />}</StyledBadge>
							</NestStat>
							<NestStat key={'supply'}>
								<span>
									<FontAwesomeIcon icon="coins" />
									<br />
									Supply
								</span>
								<br />
								<StyledBadge>
									{(supply && `${getDisplayBalance(supply)} ${nestToken}`) || (
										<SpinnerLoader />
									)}
								</StyledBadge>
							</NestStat>
							<NestStat key={Math.random().toString()}>
								<span>
									<FontAwesomeIcon icon="times-circle" />
									<br />
									NAV
								</span>
								<br />
								<StyledBadge>-</StyledBadge>
							</NestStat>
							<NestStat key={Math.random().toString()}>
								<span>
									<FontAwesomeIcon icon="times-circle" />
									<br />
									Premium
								</span>
								<br />
								<StyledBadge>-</StyledBadge>
							</NestStat>
						</NestStats>
					</StatsCardBody>
				</StatsCard>
				<NestButtons>
					<Button text="Issue" onClick={onPresentDeposit} width="30%" />
					<Spacer />
					<Button
						disabled={tokenBalance.eq(new BigNumber(0))}
						text="Redeem"
						onClick={onPresentRedeem}
						width="30%"
					/>
				</NestButtons>
				<NestAnalytics in={analyticsOpen}>
					<NestAnalyticsContainer>
						<NestBoxBreak />
						<div style={{ height: '500px' }}>
							<GraphLabel>
								Index Price{' '}
								<OverlayTrigger
									placement="top"
									overlay={
										<Tooltip id="warning-tt">
											Asset does not have a price feed yet, displaying wETH
										</Tooltip>
									}
								>
									<span>
										<FontAwesomeIcon icon='exclamation-triangle' style={{ color: '#cba92d' }} />
									</span>
								</OverlayTrigger>
							</GraphLabel>
							<GraphContainer>
								<ParentSize>
									{(parent) =>
										priceHistory && (
											<AreaGraph
												width={parent.width}
												height={parent.height}
												timeseries={priceHistory}
											/>
										)
									}
								</ParentSize>
							</GraphContainer>
						</div>
						<AllocationDisplayPrefs>
							<NestBoxHeader style={{ float: 'left' }}>
								Allocation Breakdown
							</NestBoxHeader>
							<BootButton
								variant="outline-primary"
								onClick={() => setAllocationDisplayType(false)}
								active={!allocationDisplayType}
							>
								<FontAwesomeIcon icon="table" />
							</BootButton>
							<BootButton
								variant="outline-primary"
								onClick={() => setAllocationDisplayType(true)}
								active={allocationDisplayType}
							>
								<FontAwesomeIcon icon="chart-pie" />
							</BootButton>
						</AllocationDisplayPrefs>
						{!allocationDisplayType ? (
							<StyledTable bordered hover>
								<thead>
									<tr>
										<th>Asset</th>
										<th>Allocation %</th>
										<th>Price</th>
										<th>Strategy</th>
									</tr>
								</thead>
								<tbody>
									{(composition &&
										maxAllocationPercentage &&
										_.orderBy(
											composition,
											(component) =>
												parseFloat(component.percentage.toString()),
											'desc',
										).map((component) => (
											<tr key={component.symbol}>
												<td>
													<img
														src={component.imageUrl}
														style={{ height: '32px' }}
													/>
												</td>
												<td>
													<Progress
														width={
															(component.percentage / maxAllocationPercentage) *
															100
														}
														label={`${getDisplayBalance(
															new BigNumber(component.percentage),
															0,
														)}%`}
														assetColor={component.color}
													/>
												</td>
												<td>${getDisplayBalance(component.price, 0)}</td>
												<td>
													<StyledBadge>None</StyledBadge>
												</td>
											</tr>
										))) || <SpinnerLoader />}
								</tbody>
							</StyledTable>
						) : (
							<div style={{ height: '750px' }}>
								<GraphLabel>
									Market Cap: {marketCap || <SpinnerLoader />}{' '}
									<OverlayTrigger
										placement="top"
										overlay={
											<Tooltip id="info-tt-allocations">
												Click on a section of the pie to view more information
											</Tooltip>
										}
									>
										<span>
											<FontAwesomeIcon icon="question-circle" />
										</span>
									</OverlayTrigger>
								</GraphLabel>
								<GraphContainer>
									{composition && (
										<ParentSize>
											{(parent) => (
												<PieGraph
													width={parent.width}
													height={parent.height}
													composition={composition}
												/>
											)}
										</ParentSize>
									)}
								</GraphContainer>
							</div>
						)}
					</NestAnalyticsContainer>
				</NestAnalytics>
				<NestBoxBreak />
				<NestText>
					<NestHeader>Description</NestHeader>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec imperdiet, nibh ac dictum tristique, tortor tellus commodo lacus, a feugiat dolor sem in lorem. Donec blandit diam arcu,
						quis ultricies urna volutpat a. Donec ac tortor volutpat, ullamcorper diam at, gravida neque. Aenean bibendum fermentum diam. Aenean id elit massa. Etiam at molestie risus, nec pellentesque
						lorem. Sed libero nunc, viverra mollis aliquet semper, pulvinar ac ante. Proin pellentesque, nisl id malesuada semper, ligula nunc lacinia mi, ac tincidunt nulla sapien a lorem. Nulla nunc lectus,
						sollicitudin at scelerisque non, tincidunt eu velit. Sed nec risus nulla.
					</p>

					<NestHeader>Objective</NestHeader>
					<p>
						Etiam vel augue a velit eleifend commodo. In malesuada nunc eget suscipit volutpat. Cras fermentum ullamcorper enim ut facilisis. Donec id felis lobortis, aliquet magna non, cursus tellus. Vivamus sed
						erat vitae metus elementum finibus. Sed blandit molestie consequat. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In vel elit ac urna commodo pulvinar. Nullam
						ultricies pretium tempor. Pellentesque sit amet erat gravida, aliquam sem sed, venenatis est.
					</p>

					<NestHeader>Criteria</NestHeader>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec imperdiet, nibh ac dictum tristique, tortor tellus commodo lacus, a feugiat dolor sem in lorem. Donec blandit diam arcu, quis ultricies urna
						volutpat a. Donec ac tortor volutpat, ullamcorper diam at, gravida neque. Aenean bibendum fermentum diam. Aenean id elit massa. Etiam at molestie risus, nec pellentesque lorem. Sed libero nunc, viverra mollis
						aliquet semper, pulvinar ac ante. Proin pellentesque, nisl id malesuada semper, ligula nunc lacinia mi, ac tincidunt nulla sapien a lorem. Nulla nunc lectus, sollicitudin at scelerisque non, tincidunt eu velit.
					</p>
					<NestSubHeader>Descriptive Characteristics</NestSubHeader>
					<NestList>
						<li>Pellentesque sit amet erat gravida, aliquam sem sed, venenatis est.</li>
						<li>In vel elit ac urna commodo pulvinar. Nullam ultricies pretium tempor.</li>
						<li>Donec imperdiet, nibh ac dictum tristique, tortor tellus commodo lacus, a feugiat dolor sem in lorem.</li>
						<li>Nulla nunc lectus, sollicitudin at scelerisque non, tincidunt eu velit.</li>
					</NestList>
					<NestSubHeader>Supply Characteristics</NestSubHeader>
					<NestList>
						<li>Pellentesque sit amet erat gravida, aliquam sem sed, venenatis est.</li>
						<li>In vel elit ac urna commodo pulvinar. Nullam ultricies pretium tempor.</li>
						<li>Donec imperdiet, nibh ac dictum tristique, tortor tellus commodo lacus, a feugiat dolor sem in lorem.</li>
						<li>Nulla nunc lectus, sollicitudin at scelerisque non, tincidunt eu velit.</li>
					</NestList>
					<NestSubHeader>Traction Characteristics</NestSubHeader>
					<NestList>
						<li>Pellentesque sit amet erat gravida, aliquam sem sed, venenatis est.</li>
						<li>In vel elit ac urna commodo pulvinar. Nullam ultricies pretium tempor.</li>
						<li>Donec imperdiet, nibh ac dictum tristique, tortor tellus commodo lacus, a feugiat dolor sem in lorem.</li>
						<li>Nulla nunc lectus, sollicitudin at scelerisque non, tincidunt eu velit.</li>
					</NestList>
					<NestSubHeader>Safety Characteristics</NestSubHeader>
					<NestList>
						<li>Pellentesque sit amet erat gravida, aliquam sem sed, venenatis est.</li>
						<li>In vel elit ac urna commodo pulvinar. Nullam ultricies pretium tempor.</li>
						<li>Donec imperdiet, nibh ac dictum tristique, tortor tellus commodo lacus, a feugiat dolor sem in lorem.</li>
						<li>Nulla nunc lectus, sollicitudin at scelerisque non, tincidunt eu velit.</li>
					</NestList>

					<NestHeader>Calculations</NestHeader>
					<p>
						Etiam vel augue a velit eleifend commodo:
					</p>
					<NestList>
						<li>Pellentesque sit amet erat gravida, aliquam sem sed, venenatis est.</li>
						<li>In vel elit ac urna commodo pulvinar. Nullam ultricies pretium tempor.</li>
						<li>Donec imperdiet, nibh ac dictum tristique, tortor tellus commodo lacus, a feugiat dolor sem in lorem.</li>
					</NestList>

					<NestHeader>Strategy</NestHeader>
					<p>
						Etiam vel augue a velit eleifend commodo. In malesuada nunc eget suscipit volutpat. Cras fermentum ullamcorper enim ut facilisis. Donec id felis lobortis, aliquet magna non, cursus tellus. Vivamus sed
						erat vitae metus elementum finibus. Sed blandit molestie consequat. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In vel elit ac urna commodo pulvinar. Nullam
						ultricies pretium tempor. Pellentesque sit amet erat gravida, aliquam sem sed, venenatis est.
					</p>

					<NestHeader>Management</NestHeader>
					<p>
						Pellentesque et neque iaculis, iaculis leo vitae, tincidunt lorem. Donec euismod sed elit faucibus porta. Vestibulum elit leo, interdum et feugiat nec, vehicula feugiat ipsum. Nunc sodales eros in tincidunt feugiat.
						In vel sapien leo. Vestibulum erat enim, varius quis nulla luctus, varius rhoncus nisl. Phasellus placerat sagittis ultricies. Phasellus in sollicitudin magna, ultricies volutpat tortor. Nulla egestas nulla ac pulvinar
						rhoncus. Maecenas vitae ultricies ipsum. Nunc ut erat iaculis, lacinia nisi at, sodales nunc. Proin ultricies suscipit egestas. Duis malesuada ut ante eget feugiat. Maecenas eget faucibus nisl.
					</p>
				</NestText>
			</NestBox>
		</>
	)
}

export default Nest
