const childrenCountInput = document.querySelector('#children-count');
const currentSavingsInput = document.querySelector('#current-savings');
const monthlySavingInput = document.querySelector('#monthly-saving');
const childCards = document.querySelectorAll('[data-child-card]');
const childAgeInputs = document.querySelectorAll('.child-age');
const childCourseInputs = document.querySelectorAll('.child-course');
const diagnosisCard = document.querySelector('#diagnosis-card');
const diagnosisTitleOutput = document.querySelector('#diagnosis-title');
const diagnosisRateOutput = document.querySelector('#diagnosis-rate');
const diagnosisAdditionalOutput = document.querySelector('#diagnosis-additional');
const diagnosisMessageOutput = document.querySelector('#diagnosis-message');
const totalCostOutput = document.querySelector('#total-cost');
const plannedSavingsOutput = document.querySelector('#planned-savings');
const shortageResultCard = document.querySelector('.shortage-result');
const shortageOutput = document.querySelector('#shortage');
const resultMessage = document.querySelector('#result-message');
const childCostBreakdown = document.querySelector('#child-cost-breakdown');
const detailTotalCost = document.querySelector('#detail-total-cost');
const detailCurrentSavings = document.querySelector('#detail-current-savings');
const detailMonthlySaving = document.querySelector('#detail-monthly-saving');
const detailRemainingMonths = document.querySelector('#detail-remaining-months');
const detailPlannedSavings = document.querySelector('#detail-planned-savings');
const detailAdditionalMonthly = document.querySelector('#detail-additional-monthly');
const detailShortage = document.querySelector('#detail-shortage');

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

function formatPlainYen(amount) {
  return `${new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.ceil(amount)))}円`;
}

function formatManYen(amount) {
  const manYen = Math.ceil(Math.max(0, amount) / 10000);
  return `${new Intl.NumberFormat('ja-JP').format(manYen)}万円`;
}

function formatPercent(rate) {
  return `${new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 0,
  }).format(Math.min(100, Math.max(0, Math.floor(rate))))}%`;
}

function getCourseLabel(select) {
  return select.options[select.selectedIndex].textContent.split('：')[0];
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

function getChildPlans(count) {
  const plans = [];

  for (let index = 0; index < count; index += 1) {
    const age = getNumberValue(childAgeInputs[index], 0);
    const courseCost = getNumberValue(childCourseInputs[index], 8000000);
    const remainingMonths = Math.max(0, (TARGET_AGE - age) * 12);

    plans.push({
      childNumber: index + 1,
      age,
      courseCost,
      courseLabel: getCourseLabel(childCourseInputs[index]),
      remainingMonths,
    });
  }

  return plans;
}

function calculatePlannedSavings(plans) {
  const monthlySaving = getNumberValue(monthlySavingInput, 0);
  const longestRemainingMonths = Math.max(0, ...plans.map((plan) => plan.remainingMonths));

  return monthlySaving * longestRemainingMonths;
}

function calculateAdditionalMonthly(shortage, longestRemainingMonths) {
  if (shortage <= 0 || longestRemainingMonths <= 0) {
    return 0;
  }

  return shortage / longestRemainingMonths;
}

function getDiagnosis(additionalMonthly) {
  if (additionalMonthly <= 0) {
    return {
      level: 'good',
      title: '🌳 順調です',
      message: '',
    };
  }

  if (additionalMonthly < 30000) {
    return {
      level: 'check',
      title: '🌿 育ってきています',
      message: '教育費準備は着実に進んでいます。\n\nあと少しで目標に届くペースです。\n\n家計に無理のない範囲で積立額を見直せると安心です。',
    };
  }

  return {
    level: 'grow',
    title: '🌱 これから育てていきましょう',
    message: '教育費準備には改善が必要です。\n\n今のままでは目標との開きが大きいため、\n積立額や進路の想定を一度確認してみましょう。\n\n早めに調整できるほど、\n無理のない準備がしやすくなります。',
  };
}

function getGoodMessage(shortage) {
  if (shortage <= 0) {
    return '目標額に届くペースです。\nこのまま定期的に確認していきましょう。';
  }

  return '今のペースでかなり近づいています。\nあと少しで目標額に届きそうです。';
}

function updateResultMessage(shortage, plannedSavings, additionalMonthly, achievementRate) {
  resultMessage.hidden = false;
  shortageResultCard.hidden = false;
  resultMessage.classList.remove('good', 'check', 'grow', 'warning');
  diagnosisCard.classList.remove('good', 'check', 'grow');
  shortageResultCard.classList.remove('good', 'check', 'grow');

  const diagnosis = getDiagnosis(additionalMonthly);
  const additionalText = shortage <= 0 ? '追加積立は不要です' : `毎月あと${formatPlainYen(additionalMonthly)}必要`;
  const diagnosisMessage = achievementRate > 100
    ? '目標額を上回るペースです。\n\nこのまま無理のない範囲で続けていきましょう。'
    : diagnosis.level === 'good'
      ? getGoodMessage(shortage)
      : diagnosis.message;

  diagnosisTitleOutput.textContent = diagnosis.title;
  diagnosisRateOutput.textContent = formatPercent(achievementRate);
  diagnosisAdditionalOutput.textContent = additionalText;
  diagnosisMessageOutput.textContent = diagnosisMessage;
  diagnosisCard.classList.add(diagnosis.level);
  shortageResultCard.classList.add(diagnosis.level);
  resultMessage.classList.add(diagnosis.level);

  if (diagnosis.level === 'good') {
    shortageResultCard.hidden = true;
    resultMessage.textContent = '今のペースで目標額に届きそうです。定期的に確認しながら続けていきましょう。';
    return;
  }

  if (plannedSavings === 0) {
    resultMessage.textContent = '毎月の積立額を入力すると、18歳までに準備できそうな金額と不足額がわかります。';
    return;
  }

  resultMessage.textContent = '不足額があります。積立額を少し増やす、進学時期に合わせて別の準備をするなど、早めに考えておくと安心です。';
}

function updateCalculationDetails(plans, totalCost, currentSavings, monthlySaving, longestRemainingMonths, plannedSavings, additionalMonthly, shortage) {
  childCostBreakdown.innerHTML = plans
    .map((plan) => `
      <div class="child-breakdown-item">
        <span>${plan.childNumber}人目（${plan.age}歳・${plan.courseLabel}）</span>
        <strong>${formatManYen(plan.courseCost)}</strong>
      </div>
    `)
    .join('');

  detailTotalCost.textContent = formatManYen(totalCost);
  detailCurrentSavings.textContent = formatManYen(currentSavings);
  detailMonthlySaving.textContent = formatPlainYen(monthlySaving);
  detailRemainingMonths.textContent = `${longestRemainingMonths}か月`;
  detailPlannedSavings.textContent = formatManYen(plannedSavings);
  detailAdditionalMonthly.textContent = shortage <= 0 ? '追加積立は不要です' : formatPlainYen(additionalMonthly);
  detailShortage.textContent = formatManYen(shortage);
}

function calculateEducationCost() {
  const count = getVisibleChildrenCount();
  const currentSavings = getNumberValue(currentSavingsInput, 0);
  const monthlySaving = getNumberValue(monthlySavingInput, 0);
  const plans = getChildPlans(count);
  const totalCost = plans.reduce((sum, plan) => sum + plan.courseCost, 0);
  const longestRemainingMonths = Math.max(0, ...plans.map((plan) => plan.remainingMonths));
  const plannedSavings = currentSavings + calculatePlannedSavings(plans);
  const shortage = Math.max(0, totalCost - plannedSavings);
  const additionalMonthly = calculateAdditionalMonthly(shortage, longestRemainingMonths);
  const achievementRate = totalCost > 0 ? (plannedSavings / totalCost) * 100 : 0;

  totalCostOutput.textContent = formatManYen(totalCost);
  plannedSavingsOutput.textContent = formatManYen(plannedSavings);
  shortageOutput.innerHTML = shortage <= 0
    ? '<span class="shortage-line">不足はありません</span>'
    : `<span class="shortage-line">あと</span><span class="shortage-amount">${formatManYen(shortage)}</span><span class="shortage-line">不足しています</span>`;
  updateResultMessage(shortage, plannedSavings, additionalMonthly, achievementRate);
  updateCalculationDetails(plans, totalCost, currentSavings, monthlySaving, longestRemainingMonths, plannedSavings, additionalMonthly, shortage);
}

function updateSimulator() {
  updateChildCards();
  calculateEducationCost();
}

function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const children = params.get('children');
  const ages = params.get('ages')?.split(',');
  const courses = params.get('courses')?.split(',');
  const savings = params.get('savings');
  const monthly = params.get('monthly');

  if (children) {
    childrenCountInput.value = children;
  }

  ages?.forEach((age, index) => {
    if (childAgeInputs[index]) {
      childAgeInputs[index].value = age;
    }
  });

  courses?.forEach((course, index) => {
    if (childCourseInputs[index]) {
      childCourseInputs[index].value = course;
    }
  });

  if (savings) {
    currentSavingsInput.value = savings;
  }

  if (monthly) {
    monthlySavingInput.value = monthly;
  }
}

[
  childrenCountInput,
  currentSavingsInput,
  monthlySavingInput,
  ...childAgeInputs,
  ...childCourseInputs,
].forEach((input) => {
  input.addEventListener('input', updateSimulator);
  input.addEventListener('change', updateSimulator);
});

applyQueryParams();
updateSimulator();
