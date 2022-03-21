import { Variables } from '../views/Delphi/types'

const OPCODES: { [operator: string]: string } = {
  '+': '4',
  '-': '5',
  '*': '6',
  '/': '7',
  '^': '8',
  '%': '9',
  '==': '10',
  '!=': '11',
  '<': '12',
  '>': '13',
  '<=': '14',
  '>=': '15',
  '&&': '16',
  '||': '17',
  '?': '18',
}

function isOperator(c: string) {
  return (
    !(c >= 'a' && c <= 'z') &&
    !(c >= '0' && c <= '9') &&
    !(c >= 'A' && c <= 'Z')
  )
}

// Find priority of given operator.
function getPriority(c: string) {
  if (c === '-' || c === '+') return 1
  else if (c === '*' || c === '/') return 2
  else if (c === '^') return 3
  else if (parseInt(OPCODES[c]) >= 10 && parseInt(OPCODES[c]) <= 15) return 4
  else if (parseInt(OPCODES[c]) >= 16 && parseInt(OPCODES[c]) >= 18) return 5
  return 0
}

// Function that converts infix expression to prefix expression.
export const shuntingYard = (infix: string, variables: Variables): any[] => {
  // Ternary parsing
  if (infix.includes('?') && infix.includes(':')) {
    const split = infix.split('?')
    const split2 = split[1].split(':')
    return [OPCODES['?']]
      .concat(shuntingYard(split[0], variables))
      .concat(shuntingYard(split2[0], variables))
      .concat(shuntingYard(split2[1], variables))
  }

  infix = infix.replaceAll(' ', '')

  let operators = []
  let operands = []

  for (let i = 0; i < infix.length; i++) {
    // If current character is an opening bracket, then push into the operators stack.
    if (infix[i] === '(') operators.push(infix[i])

    // If current character is a closing bracket, then pop from
    // both stacks and push result in operands stack until
    // matching opening bracket is not found.
    else if (infix[i] === ')') {
      while (operators.length !== 0 && operators[operators.length - 1] !== '(') {
        let op1: any = operands.pop()
        let op2: any = operands.pop()
        let op = operators.pop()

        // Add operands and operator in form OPCODE[operator], operand1, operand2.
        operands.push([OPCODES[op], op2, op1])
      }

      // Pop opening bracket from stack.
      operators.pop()
    }

    // If current character is an
    // operand then push it into
    // operands stack.
    else if (!isOperator(infix[i])) {
      if (infix[i].match(/[a-z]/i)) {
        const v = variables[infix[i]]
        if (!v) continue
        if (v.type === 'AGGREGATOR') {
          operands.push([
            '1',
            Object.keys(variables)
              .filter((obj) => variables[obj].type === 'AGGREGATOR')
              .indexOf(infix[i]), // Index of aggregator
          ])
        } else {
          operands.push(['0', v.value.toString()])
        }
      }
    }

    // If current character is an
    // operator, then push it into
    // operators stack after popping
    // high priority operators from
    // operators stack and pushing
    // result in operands stack.
    else {
      while (
        operators.length &&
        getPriority(infix[i]) <= getPriority(operators[operators.length - 1])
      ) {
        let op1: any = operands.pop()
        let op2: any = operands.pop()
        let op = operators.pop()

        operands.push([OPCODES[op], op2, op1])
      }

      operators.push(
        isTwoCharOperator(infix, i) ? infix[i] + infix[i++ + 1] : infix[i],
      )
    }
  }

  while (operators.length !== 0) {
    let op1: any = operands.pop()
    let op2: any = operands.pop()
    let op = operators.pop()

    operands.push([OPCODES[op], op2, op1])
  }

  // Final prefix expression is present in operands stack.
  const base = operands[operands.length - 1]
  console.log(base, flatten(base))
  return flatten(base)
}

const isTwoCharOperator = (infix: string, index: number) =>
  OPCODES[infix[index] + infix[index + 1]]

const flatten = (a: any) => {
  if (!a) return

  let ret: string[] = []
  a.forEach((item: any) => {
    if (typeof item === 'object') {
      ret = ret.concat(flatten(item))
      return
    }

    ret.push(item)
  })
  return ret
}
