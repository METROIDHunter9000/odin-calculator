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
    operand2 = new Operand(0, false);
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
    if(operand2.val != 0){
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
let fractional_mode = 0;
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

function removeDigit(operand){
  if(fractional_mode === 0){
    operand.val = Math.floor(operand.val / 10);
  }else{
    operand.val = +operand.val.toFixed(fractional_mode - 2);
    fractional_mode--;
    if(fractional_mode === 1){
      fractional_mode = 0;
    }
  }
  updateDisplay();
}

function selectOperator(op) {
  operator = Operators[op];
  fractional_mode = 0;
  updateDisplay();
}

function clear() {
  operand1 = new Operand(0, true);
  operand2 = null;
  operator = null;
  fractional_mode = 0;
  updateDisplay();
}

function negate(operand) {
  operand.sign = ! operand.sign;
  updateDisplay();
}

function percentify(operand) {
  operand.val /= 100;
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
  result = operator.fn(operand1, operand2);
  operand1 = result;
  operator = null;
  operand2 = null;
  updateDisplay();
}
