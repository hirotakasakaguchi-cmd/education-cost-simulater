const childrenCountInput = document.querySelector('#children-count');
const educationCourseInput = document.querySelector('#education-course');
const currentSavingsInput = document.querySelector('#current-savings');
const monthlySavingInput = document.querySelector('#monthly-saving');
const childCards = document.querySelectorAll('[data-child-card]');
const childAgeInputs = document.querySelectorAll('.child-age');
const totalCostOutput = document.querySelector('#total-cost');
const plannedSavingsOutput = document.querySelector('#planned-savings');
const shortageOutput = document.querySelector('#shortage');
const resultMessage = document.querySelector('#result-message');

const TARGET_AGE = 18;

const yenFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

function getNumberValue(input, fallback = 0) {
  const value = Number(input.value);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function formatYen(amount) {
  return yenFormatter.format(Math.max(0, Math.ceil(amount)));
}

function getVisibleChildrenCount() {
  return Math.min(3, Math.max(1, getNumberValue(childrenCountInput, 1)));
}

function updateChildCards() {
  const count = getVisibleChildrenCount();

  childCards.forEach((card) => {
    const childNumber = Number(card.dataset.childCard);
    card.hidden = childNumber > count;
  });
}

function calculatePlannedSavings(count) {
  const monthlySaving = getNumberValue(monthlySavingInput, 0);
  let plannedSavings = 0;

  for (let index = 0; index < count; index += 1) {
    const age = getNumberValue(childAgeInputs[index], 0);
    const remainingMonths = Math.max(0, (TARGET_AGE - age) * 12);
    plannedSavings += monthlySaving * remainingMonths;
  }

  return plannedSavings;
}

function updateResultMessage(shortage, plannedSavings) {
  resultMessage.classList.remove('good', 'warning');

  if (shortage <= 0) {
    resultMessage.textContent = '今の積立ペースなら、目安額には届きそうです。必要に応じて進路や生活費も一緒に見直しましょう。';
    resultMessage.classList.add('good');
    return;
  }

  if (plannedSavings === 0) {
    resultMessage.textContent = '毎月の積立額を入力すると、18歳までに準備できそうな金額と不足額がわかります。';
    resultMessage.classList.add('warning');
    return;
  }

  resultMessage.textContent = '不足額があります。積立額を少し増やす、進学時期に合わせて別の準備をするなど、早めに考えておくと安心です。';
  resultMessage.classList.add('warning');
}

function calculateEducationCost() {
  const count = getVisibleChildrenCount();
  const courseCost = getNumberValue(educationCourseInput, 8000000);
  const currentSavings = getNumberValue(currentSavingsInput, 0);
  const totalCost = courseCost * count;
  const plannedSavings = currentSavings + calculatePlannedSavings(count);
  const shortage = Math.max(0, totalCost - plannedSavings);

  totalCostOutput.textContent = formatYen(totalCost);
  plannedSavingsOutput.textContent = formatYen(plannedSavings);
  shortageOutput.textContent = formatYen(shortage);
  updateResultMessage(shortage, plannedSavings);
}

function updateSimulator() {
  updateChildCards();
  calculateEducationCost();
}

[
  childrenCountInput,
  educationCourseInput,
  currentSavingsInput,
  monthlySavingInput,
  ...childAgeInputs,
].forEach((input) => {
  input.addEventListener('input', updateSimulator);
  input.addEventListener('change', updateSimulator);
});

updateSimulator();
