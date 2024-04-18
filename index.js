// Operator represents a simple mathematical operation with a display string
class Operator {
  constructor(display, fn) {
    this.display = display;
    this.fn = fn;
  }
}

const Operators = {
  "+": new Operator("+", (op1,op2) => {
    newVal = op1.realVal() + op2.realVal();
    sign = newVal >= 0;
    return new Operand(Math.abs(newVal), sign);
  }),
  "-": new Operator("-", (op1,op2) => {
    newVal = op1.realVal() - op2.realVal();
    sign = newVal >= 0;
    return new Operand(Math.abs(newVal), sign);
  }),
  "/": new Operator("/", (op1,op2) => {
    newVal = op1.realVal() / op2.realVal();
    sign = newVal >= 0;
    return new Operand(Math.abs(newVal), sign);
  }),
  "*": new Operator("*", (op1,op2) => {
    newVal = op1.realVal() * op2.realVal();
    sign = newVal >= 0;
    return new Operand(Math.abs(newVal), sign);
  })
}

// Calculator design is based loosely on a FSM
const State = {
  "op1": 1,
  "operator": 2,
  "op2": 3,
  "result": 4
}

// Operand represents a number with a sign
class Operand {
  constructor(val, sign) {
    this.val = val;
    this.sign = sign;
  }

  realVal() {
    // "True" indiciates a positive sign. False is negative
    if(this.sign){
      return this.val;
    }else{
      return -1 * this.val;
    }
  }
}

// Initialize state
let calc_state = State.op1;
let fractional_mode = 0;
let operand1;
let operand2;
let operator;
clear();
updateDisplay();

calculator = document.querySelector('#calculator');
calculator.addEventListener('click', event => {
  if(event.target.classList.contains("btn_num")) {
    enterDigit(event.target.innerText);
  }else if(event.target.classList.contains("btn_op")){
    selectOperator(Operators[event.target.innerText]);
  }
});

calculator.addEventListener('keypress', () => {
  
});

btn_clear = document.querySelector('#btn_clear');
btn_clear.addEventListener('click', () => {
  clear();
});

btn_eval = document.querySelector('#btn_eval');
btn_eval.addEventListener('click', () => {
  evaluate();
});

btn_sign= document.querySelector('#btn_sign');
btn_sign.addEventListener('click', () => {
  negate();
});

btn_decimal = document.querySelector('#btn_decimal');
btn_decimal.addEventListener('click', () => {
  freezeDecimal();
});

btn_percent = document.querySelector('#btn_percent');
btn_percent.addEventListener('click', () => {
  percentify();
});

display = document.querySelector('#display');
function updateDisplay() {
  switch(calc_state){
    case State.operator:
      display.innerText = `${operand1.realVal()} ${operator.display}`
      break;
    case State.op2:
      display.innerText = `${operand1.realVal()} ${operator.display} ${operand2.realVal()}`
      break;
    default:
      display.innerText = `${operand1.realVal()}`
  }
  display.innerText = display.innerText.slice(-21);
}

function enterDigit(digit) {
  digit = +digit;
  let operand = operand1;
  if(calc_state === State.operator){
    operand2 = new Operand(0, true);
    calc_state = State.op2;
  }else if(calc_state === State.result){
    operand1 = new Operand(0, true);
    operand = operand1;
    calc_state = State.op1;
  }
  if(calc_state !== State.op1){
    operand = operand2;
  }

  if(fractional_mode === 0){
    operand.val *= 10;
    operand.val += digit;
  }else if(fractional_mode > 0){
    operand.val += digit / 10**fractional_mode++;
  }else{
    throw `Illegal value for fractional_mode: ${fractional_mode}`
  }
  updateDisplay();
}

function selectOperator(op) {
  if(calc_state === State.op2){
    evaluate();
  }

  if(typeof op === "object"){
    operator = op;
    calc_state = State.operator;
    fractional_mode = 0;
  }else{
    throw `Illegal argument type for selectOperator: ${typeof op}`
  }
  updateDisplay();
}

function clear() {
  calc_state = State.op1;
  operand1 = new Operand(0, true);
  operand2 = null;
  operator = null;
  fractional_mode = 0;
  updateDisplay();
}

function negate() {
  switch(calc_state){
    case State.op1:
      operand1.sign = ! operand1.sign;
      break;
    case State.operator:
      operand2 = new Operand(0, false);
      calc_state = State.op2;
      break;
    case State.op2:
      operand2.sign = ! operand2.sign;
      break;
    case State.result:
      operand1.sign = ! operand1.sign;
      break;
  }
  updateDisplay();
}

function percentify() {
  if(calc_state === State.op1 || calc_state === State.result){
    operand1.val /= 100;
  }else if(calc_state === State.op2){
    operand2.val /= 100;
  }
  if(fractional_mode == 0){
    fractional_mode = 1;
  }
  fractional_mode += 2;
  updateDisplay();
}

function freezeDecimal() {
  if(fractional_mode == 0){
    fractional_mode = 1;
  }
  updateDisplay();
}

function evaluate() {
  if(calc_state === State.op2){
    result = operator.fn(operand1, operand2);
    operand1 = result;
    operator = null;
    operand2 = null;
    calc_state = State.result;
  }
  updateDisplay();
}
