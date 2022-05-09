import React, { useMemo, useState } from 'react'
import { StyledTable } from '../../../components/Table'
import Tooltipped from '../../../components/Tooltipped'
import { getDisplayBalance } from '../../../utils/numberFormat'
import { BigNumber } from 'bignumber.js'
import { StyledBadge } from '../../../components/Badge'
import { SpinnerLoader } from '../../../components/Loader'
import { Progress } from '../../../components/ProgressBar'
import _ from 'lodash'
import { BasketComponent } from '../../../hooks/baskets/useComposition'
import { ParentSize } from '@visx/responsive'
import DonutGraph from '../../../components/Graphs/PieGraph'
import styled from "styled-components";
import {Badge, Col, Row} from "react-bootstrap";
import {Button} from "../../../components/Button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

type CompositionProps = {
	composition: BasketComponent[]
}

type DisplayType = 'TABLE' | 'PIE'

const Composition: React.FC<CompositionProps> = ({ composition }) => {
	const [displayType, setDisplayType] = useState<DisplayType>('TABLE')

	const maxPercentage = useMemo(() => {
		if (!composition) return

		return _.max(composition.map((component) => component.percentage))
	}, [composition])

	return (
		<div style={{ padding: '0 0.75rem' }}>
			<Row style={{ marginBottom: '1em' }}>
				<Col lg={1}>
					<Button  onClick={() => setDisplayType('TABLE')}>
						<FontAwesomeIcon icon="table" />
					</Button>
				</Col>
				<Col lg={1}>
					<Button onClick={() => setDisplayType('PIE')}>
						<FontAwesomeIcon icon="chart-pie" />
					</Button>
				</Col>
			</Row>

			{displayType === 'TABLE' ? (
				<StyledTable bordered hover>
					<thead>
						<tr>
							<th>Token</th>
							<th>Allocation</th>
							<th>Price</th>
							<th className="strategy">Strategy</th>
						</tr>
					</thead>
					<tbody>
						{(composition &&
							composition
								.sort((a, b) => (a.percentage < b.percentage ? 1 : -1))
								.map((component: any) => (
									<tr key={component.symbol}>
										<td width="15%">
											<Tooltipped content={component.symbol}>
												<img
													src={component.image}
													style={{ height: '32px' }}
													alt="component"
												/>
											</Tooltipped>
										</td>
										<td width="50%">
											<Progress
												width={(component.percentage / maxPercentage) * 100}
												label={`${getDisplayBalance(
													new BigNumber(component.percentage),
													0,
												)}%`}
												assetColor={component.color}
											/>
										</td>
										<td width="20%">
											$
											{getDisplayBalance(
												component.basePrice || component.price,
												0,
											)}
										</td>
										<td className="strategy" width="15%">
											<StyledBadge>{component.strategy || 'None'}</StyledBadge>
										</td>
									</tr>
								))) || (
							<tr>
								{_.times(4, () => (
									<td width="25%">
										<SpinnerLoader />
									</td>
								))}
							</tr>
						)}
					</tbody>
				</StyledTable>
			) : (
				<GraphContainer>
					<Row style={{ height: '100%' }}>
						<Col lg={8}>
							{composition && (
								<ParentSize>
									{(parent) => (
										<DonutGraph
											width={parent.width}
											height={parent.height}
											composition={composition}
										/>
									)}
								</ParentSize>
							)}
						</Col>
						<Col lg={4} style={{ margin: 'auto' }}>
							<Row lg={2}>
								{composition &&
								composition.map((component) => (
									<Col key={component.symbol}>
										<AssetBadge color={component.color}>
											{component.symbol}
										</AssetBadge>
									</Col>
								))}
							</Row>
						</Col>
					</Row>
				</GraphContainer>
			)}
		</div>
	)
}

const GraphContainer = styled.div`
	height: 500px;
	border-radius: 8px;
	background-color: ${(props) => props.theme.color.transparent[100]};
`

const AssetBadge = styled(Badge)`
	&.bg-primary {
		background-color: ${(props: any) => props.color} !important;
		color: #fff8ee !important;
	}
	
	margin: 8px 0;
`

export default Composition
