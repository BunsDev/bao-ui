import { SpinnerLoader } from 'components/Loader'
import Page from 'components/Page'
import PageHeader from 'components/PageHeader'
import { useMarkets } from 'hooks/markets/useMarkets'
import React from 'react'
import { Alert, Container } from 'react-bootstrap'
import { Route, useRouteMatch } from 'react-router-dom'
import ConnectedCheck from 'components/ConnectedCheck'
import { MarketList } from './components/MarketList'
import { Overview } from './components/Overview'
import Market from './Market'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Spacer from 'components/Spacer'

const Markets: React.FC = () => {
	const markets = useMarkets()
	const { path } = useRouteMatch()

	return (
		<Page>
			<PageHeader
				icon=""
				title="Markets"
				subtitle="Mint synthethic assets with multiple types of collateral!"
			/>
			<ConnectedCheck>
				<Route exact path={path}>
					<Container>
						<StyledAlert variant="danger">
							<img src="/siren.gif" style={{ width: '2rem' }} /> <br />
							Bao Markets is currently in a soft launch. Collateral Factors for
							synths are set low intentionally, and they will be adjusted as the
							protocol sees usage over the coming weeks. Please be prudent,{' '}
							<a href="https://docs.bao.finance">
								<FontAwesomeIcon icon="file-alt" /> read the docs
							</a>
							, and{' '}
							<a href="https://discord.gg/WPjtXXWnnU">
								<FontAwesomeIcon icon={['fab', 'discord']} /> ask questions
							</a>{' '}
							before interacting with the protocol at this time.
							<br />
							<br />
							Please report any UI bugs on the{' '}
							<a href="https://github.com/baofinance/bao-ui/issues">
								<FontAwesomeIcon icon={['fab', 'github']} /> UI's Github
								Repository
							</a>{' '}
							(preferred) or on our{' '}
							<a href="https://discord.gg/WPjtXXWnnU">
								<FontAwesomeIcon icon={['fab', 'discord']} /> Discord
							</a>
							.
						</StyledAlert>
						<Overview />
						{markets ? (
							<MarketList markets={markets} />
						) : (
							<SpinnerLoader block />
						)}
					</Container>
				</Route>
				<Route path={`${path}/:marketId`}>
					<Market />
				</Route>
			</ConnectedCheck>
		</Page>
	)
}

// TEMP
const StyledAlert = styled(Alert)`
	text-align: center;
	margin: 25px;

	> b {
		font-weight: bold;
	}

	> a {
		color: inherit;
		font-weight: bold;
	}

	@media (max-width: ${(props) => props.theme.breakpoints.sm}px) {
		font-size: 0.875rem;
	}
`

export default Markets
