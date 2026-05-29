const childrenCount = document.querySelector('#children-count');
const educationCourse = document.querySelector('#education-course');
const childAge = document.querySelector('#child-age');
const currentSavings = document.querySelector('#current-savings');
const totalCost = document.querySelector('#total-cost');
const remainingCost = document.querySelector('#remaining-cost');
const monthlySaving = document.querySelector('#monthly-saving');
const ageMessage = document.querySelector('#age-message');

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

function calculateEducationCost() {
  const count = getNumberValue(childrenCount, 1);
  const courseCost = getNumberValue(educationCourse, 8000000);
  const age = getNumberValue(childAge, 0);
  const savings = getNumberValue(currentSavings, 0);

  const total = courseCost * count;
  const remaining = Math.max(0, total - savings);
  const remainingYears = 18 - age;

  totalCost.textContent = formatYen(total);
  remainingCost.textContent = formatYen(remaining);

  if (remainingYears <= 0) {
    monthlySaving.textContent = '早めに別途確認しましょう';
    ageMessage.hidden = false;
    return;
  }

  const monthly = remaining / remainingYears / 12;
  monthlySaving.textContent = formatYen(monthly);
  ageMessage.hidden = true;
}

[childrenCount, educationCourse, childAge, currentSavings].forEach((input) => {
  input.addEventListener('input', calculateEducationCost);
  input.addEventListener('change', calculateEducationCost);
});

calculateEducationCost();
