import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styled from 'styled-components'
import { darken } from 'polished'

interface TooltippedProps {
	content: string
	children?: JSX.Element
	placement?: any
}

const Tooltipped: React.FC<TooltippedProps> = ({
	children,
	content,
	placement,
}) => (
	<>
		<OverlayTrigger
			overlay={<Tooltip id={Math.random().toString()}>{content}</Tooltip>}
			placement={placement || 'bottom'}
		>
			{children || (
				<span>
					<QuestionIcon icon="question-circle" />
				</span>
			)}
		</OverlayTrigger>
	</>
)

const QuestionIcon = styled(FontAwesomeIcon)`
	color: ${(props) => darken(0.2, props.theme.color.primary[100])};

	&:hover,
	&:focus {
		color: ${(props) => props.theme.color.primary[100]};
		animation: 200ms;
	}
`

export default Tooltipped
export type { TooltippedProps }
