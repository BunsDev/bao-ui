import overlay from 'assets/img/overlay.png'
import React from 'react'
import styled from 'styled-components'
import Footer from '../Footer'
import {Alert, Badge, Container} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Page: React.FC = ({ children }) => (
	<StyledPageContainer>
		<StyledPageWrapper>
			<Container>
				<Alert variant="warning" style={{ margin: 0, textAlign: 'center' }}>
					<b>
						<FontAwesomeIcon icon="exclamation-triangle" /> NOTICE{' '}
						<FontAwesomeIcon icon="exclamation-triangle" />
					</b>
					<br />
					2021-09-18 - SushiSwap's matic-exchange subgraph is experiencing{' '}
					issues at the moment, and all token prices are inaccurate. Funds are
					safe, and this issue affects the front-end only. Until the subgraph
					re-syncs, we are adjusting their prices as follows:{' '}
					<Badge bg="warning">
						(subgraph_price / weth_price) * matic_price
					</Badge>
					{', '}
					where ETH price and MATIC price come from ChainLink oracles deployed
					on Polygon.
					<br />
					There may still be some slippage in USD evaluations, however. Sushi's
					subgraph should be re-synced{' '}
					<a
						href="https://thegraph.com/legacy-explorer/subgraph/sushiswap/matic-exchange?version=pending"
						style={{ textDecoration: 'underline', color: '#664d03' }}
					>
						~9 days from this notice
					</a>
					.
				</Alert>
			</Container>
			<StyledMain>{children}</StyledMain>
			<Footer />
		</StyledPageWrapper>
	</StyledPageContainer>
)

const StyledPageContainer = styled.div`
	display: table;
	position: absolute;
	top: ${(props) => props.theme.topBarSize}px;
	left: 0;
	height: calc(100vh - ${(props) => props.theme.topBarSize}px);
	width: 100%;
`

const StyledPageWrapper = styled.div`
	display: table-cell;
	vertical-align: middle;
	min-height: calc(100vh - ${(props) => props.theme.topBarSize}px);
	background-image: url(${overlay});
	background-size: cover;
	background-repeat: no-repeat;
	top: 0;
	left: 0;
`

const StyledMain = styled.div`
	align-items: center;
	display: flex;
	flex-direction: column;
    min-height: calc(100vh - 240px);
	`

export default Page
