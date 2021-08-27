import React from 'react'
import styled from 'styled-components'
import baoLogo from 'assets/img/bao-logo.png'
import { Link } from 'react-router-dom'

const Branding: React.FC = () => {
	return (
		<StyledLogo to="https://bao.finance">
			<StyledText>
				<TitleText>
						<span>by Bao.Finance</span>
				</TitleText>
			</StyledText>
		</StyledLogo>
	)
}

const TitleText = styled.div`
	width: fit-content;
	white-space: nowrap;
	color: ${(props) => props.theme.color.grey[100]};
	font-family: 'Kaushan Script', sans-serif;
	font-size: 24px;
	letter-spacing: 0.03rem;
	margin-left: ${(props) => props.theme.spacing[2]}px;
`

const StyledLogo = styled(Link)`
	align-items: center;
	display: flex;
	justify-content: center;
	margin: 0;
	min-height: 60px;
	min-width: 60px;
	padding: 0;
	text-decoration: none;
    margin-bottom: 25px;
`

const StyledText = styled.span`
	color: ${(props) => props.theme.color.grey[600]};
	font-family: 'Rubik', sans-serif;
	font-size: 20px;
	font-weight: 700;
	letter-spacing: 0.03em;
	margin-left: ${(props) => props.theme.spacing[2]}px;
	@media (max-width: 400px) {
		display: none;
	}
`

export default Branding
