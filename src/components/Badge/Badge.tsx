import { Badge } from 'react-bootstrap'
import styled from 'styled-components'

export const StyledBadge = styled(Badge)`
	font-size: 1em;
	color: ${(props) => props.theme.color.text[100]};
	font-weight: ${(props) => props.theme.fontWeight.medium};
	background-color: ${(props) => props.theme.color.primary[100]} !important;
	border: ${(props) => props.theme.border.default};
	`

export const PriceBadge = styled(Badge)`
	font-size: 1em;
	background: ${(props) => props.theme.color.transparent[100]};
	color: ${(props) => props.theme.color.text[100]};
`

export const CompositionBadge = styled(Badge)`
	font-size: 1em;
	color: ${(props) => props.theme.color.text[100]};
	font-weight: ${(props) => props.theme.fontWeight.medium};
	background-color: ${(props) => props.theme.color.primary[300]} !important;
	`

	export const StatBadge = styled(Badge)`
	font-size: 1em;
	color: ${(props) => props.theme.color.text[100]};
	font-weight: ${(props) => props.theme.fontWeight.medium};
	background-color: ${(props) => props.theme.color.primary[200]} !important;
	`

	export const AssetBadge = styled(Badge)`
	&.bg-primary {
		background-color: ${(props: any) => props.color} !important;
		color: #fff8ee !important;
	}

	margin: 8px 0;
`