class FSMState {
  constructor(handleInput) {
    if(typeof handleInput === 'function'){
      this.handleInput = handleInput;
    }else{
      throw `Illegal argument: ${typeof handleInput}`
    }
  }
}

// Operand represents a number with a sign
class Operand {
  constructor(val, sign) {
    this.valMajor = String(val);
    this.sign = sign;
    this.valMinor = '';
  }

  realVal() {
    let realVal = +this.valMajor + +this.valMinor / 10**this.valMinor.length;

    // "True" indiciates a positive sign. False is negative
    if(this.sign){
      return realVal;
    }else{
      return -1 * realVal;
    }
  }
}

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

const REGEX_DIGIT = /^\d{1}$/
const REGEX_OPR = /^[\/\-\+\*]{1}$/
let stateOp1;
let stateOpr;
let stateOp2;
let stateR;

/*
 * stateOp1 represents the state where
 * operand1 is the operand being modified
 */
stateOp1 = new FSMState(input => {
  if(REGEX_DIGIT.test(input)){
    let digit = +input;
    enterDigit(operand1, digit);

  }else if(REGEX_OPR.test(input)){
    selectOperator(input);
    return stateOpr;

  }else if(input === '.'){
    freezeDecimal();

  }else if(input === 'AC' || input === 'Escape'){
    clear();

  }else if(input === '+/-'){
    negate(operand1);

  }else if(input === 'Backspace'){
    removeDigit(operand1);

  }else if(input === '%'){
    percentify(operand1);
  }

  return stateOp1;
});

/*
 * stateOpr represents the state where
 * an operator has been selected, but
 * a second operand has not been
 */
stateOpr = new FSMState(input => {
  if(REGEX_DIGIT.test(input)){
    operand2 = new Operand(0, true);
    let digit = +input;
    enterDigit(operand2, digit);
    return stateOp2;

  }else if(input === 'Backspace'){
    operator = null;
    updateDisplay();
    return stateOp1;

  }else if(REGEX_OPR.test(input)){
    selectOperator(input);

  }else if(input === '.'){
    operand2 = new Operand(0, true);
    freezeDecimal();
    return stateOp2;

  }else if(input === 'AC' || input === 'Escape'){
    clear();
    return stateOp1;

  }else if(input === '+/-'){
    operand2 = new Operand(0, false);
    return stateOp2;
  }

  return stateOpr;
});

/*
 * stateOp2 represents the state where
 * operand2 is the operand being modified
 */
stateOp2 = new FSMState(input => {
  if(REGEX_DIGIT.test(input)){
    let digit = +input;
    enterDigit(operand2, digit);

  }else if(REGEX_OPR.test(input)){
    evaluate();
    selectOperator(input);
    return stateOpr;

  }else if(input === '.'){
    freezeDecimal();

  }else if(input === 'AC' || input === 'Escape'){
    clear();
    return stateOp1;

  }else if(input === '+/-'){
    negate(operand2);

  }else if(input === '%'){
    percentify(operand2);

  }else if(input === 'Backspace'){
    if(operand2.realVal() != 0){
      removeDigit(operand2);
    }else{
      operand2 = null;
      updateDisplay();
      return stateOpr;
    }

  }else if(input === '=' || input === "Enter"){
    evaluate();
    return stateR;
  }

  return stateOp2;
});

/*
 * stateR represents the state where
 * a result has just been calculated
 */
stateR = new FSMState(input => {
  if(REGEX_DIGIT.test(input)){
    operand1 = new Operand(0, true);
    let digit = +input;
    enterDigit(operand1, digit);
    return stateOp1;

  }else if(REGEX_OPR.test(input)){
    selectOperator(input);
    return stateOpr;

  }else if(input === 'Backspace'){
    removeDigit(operand1);
    return stateOp1;

  }else if(input === '.'){
    freezeDecimal();
    return stateOp1;

  }else if(input === 'AC' || input === 'Escape'){
    clear();
    return stateOp1;

  }else if(input === '+/-'){
    negate(operand1);

  }else if(input === '%'){
    percentify(operand1);
  }
  
  return stateR;
});

// Initialize state
let fsmState = stateOp1;
let fractional_mode = false;
let operand1;
let operand2;
let operator;
clear();
updateDisplay();

calculator = document.querySelector('#calculator');
calculator.addEventListener('click', event => {
  fsmState = fsmState.handleInput(event.target.innerText);
});

document.addEventListener('keydown', event => {
  if(!/^F\d{1,2}$/.test(event.key)){
    event.preventDefault();
  }
  fsmState = fsmState.handleInput(event.key);
});

display = document.querySelector('#display');
function updateDisplay() {
  display.innerText = `${operand1.realVal()}`
  if(operator !== null){
    display.innerText += ` ${operator.display}`;
  }
  if(operand2 !== null){
    display.innerText += ` ${operand2.realVal()}`;
  }
  display.innerText = display.innerText.slice(-21);
}

function enterDigit(operand, digit) {
  if(!fractional_mode){
    operand.valMajor += digit;
  }else{
    operand.valMinor += digit;
  }
  updateDisplay();
}

function removeDigit(operand){
  if(!operand.valMinor){
    fractional_mode = false;
    operand.valMajor = operand.valMajor.slice(0, -1);
  }else{
    fractional_mode = true;
    operand.valMinor = operand.valMinor.slice(0, -1);
    if(operand.valMinor){
      fractional_mode = false;
    }
  }
  updateDisplay();
}

function selectOperator(op) {
  operator = Operators[op];
  fractional_mode = false;
  updateDisplay();
}

function clear() {
  operand1 = new Operand(0, true);
  operand2 = null;
  operator = null;
  fractional_mode = false;
  updateDisplay();
}

function negate(operand) {
  operand.sign = ! operand.sign;
  updateDisplay();
}

function percentify(operand) {
  let shift = operand.valMajor.slice(-2)
  if(shift.length == 1){
    shift = `0${shift}`;
  }
  operand.valMajor = operand.valMajor.slice(0, -2);
  if(operand.valMajor === ''){
    operand.valMajor = '0';
  }
  operand.valMinor = `${shift}${operand.valMinor}`

  if(fractional_mode == false){
    fractional_mode = true;
  }
  updateDisplay();
}

function freezeDecimal() {
  if(!fractional_mode){
    fractional_mode = true;
  }
  updateDisplay();
}

function evaluate() {
  result = operator.fn(operand1, operand2);
  operand1 = result;
  operator = null;
  operand2 = null;
  updateDisplay();
}
