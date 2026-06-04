const childrenCountInput = document.querySelector('#children-count');
const currentSavingsInput = document.querySelector('#current-savings');
const monthlySavingInput = document.querySelector('#monthly-saving');
const savingMethodInputs = document.querySelectorAll('input[name="saving-method"]');
const childCards = document.querySelectorAll('[data-child-card]');
const childAgeInputs = document.querySelectorAll('.child-age');
const childCourseInputs = document.querySelectorAll('.child-course');
const diagnosisCard = document.querySelector('#diagnosis-card');
const diagnosisTitleOutput = document.querySelector('#diagnosis-title');
const diagnosisRateOutput = document.querySelector('#diagnosis-rate');
const diagnosisAdditionalOutput = document.querySelector('#diagnosis-additional');
const diagnosisMessageOutput = document.querySelector('#diagnosis-message');
const totalCostOutput = document.querySelector('#total-cost');
const resultSavingMethodOutput = document.querySelector('#result-saving-method');
const plannedSavingsOutput = document.querySelector('#planned-savings');
const shortageResultCard = document.querySelector('.shortage-result');
const shortageOutput = document.querySelector('#shortage');
const resultMessage = document.querySelector('#result-message');
const nisaNote = document.querySelector('#nisa-note');
const createResultCardButton = document.querySelector('#create-result-card');
const shareCardPanel = document.querySelector('#share-card-panel');
const downloadResultCard = document.querySelector('#download-result-card');
const shareStage = document.querySelector('#share-stage');
const shareRate = document.querySelector('#share-rate');
const shareAdditional = document.querySelector('#share-additional');
const shareMessage = document.querySelector('#share-message');
const childCostBreakdown = document.querySelector('#child-cost-breakdown');
const detailTotalCost = document.querySelector('#detail-total-cost');
const detailCurrentSavings = document.querySelector('#detail-current-savings');
const detailMonthlySaving = document.querySelector('#detail-monthly-saving');
const detailSavingMethod = document.querySelector('#detail-saving-method');
const detailRemainingMonths = document.querySelector('#detail-remaining-months');
const detailPlannedSavings = document.querySelector('#detail-planned-savings');
const detailAdditionalMonthly = document.querySelector('#detail-additional-monthly');
const detailShortage = document.querySelector('#detail-shortage');

const TARGET_AGE = 18;

const SAVING_METHODS = {
  deposit: {
    label: '貯金',
    annualRate: 0,
  },
  insurance: {
    label: '学資保険',
    annualRate: 0.005,
  },
  nisa: {
    label: 'NISA',
    annualRate: 0.05,
  },
};

let latestResult = null;

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, width, height, radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

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

function getSavingMethod() {
  const checkedInput = [...savingMethodInputs].find((input) => input.checked);
  return SAVING_METHODS[checkedInput?.value] ?? SAVING_METHODS.deposit;
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
  const currentSavings = getNumberValue(currentSavingsInput, 0);
  const monthlySaving = getNumberValue(monthlySavingInput, 0);
  const longestRemainingMonths = Math.max(0, ...plans.map((plan) => plan.remainingMonths));
  const monthlyRate = getSavingMethod().annualRate / 12;

  if (monthlyRate <= 0) {
    return currentSavings + monthlySaving * longestRemainingMonths;
  }

  const futureCurrentSavings = currentSavings * ((1 + monthlyRate) ** longestRemainingMonths);
  const futureMonthlySavings = monthlySaving * (((1 + monthlyRate) ** longestRemainingMonths - 1) / monthlyRate);

  return futureCurrentSavings + futureMonthlySavings;
}

function calculateAdditionalMonthly(shortage, longestRemainingMonths) {
  if (shortage <= 0 || longestRemainingMonths <= 0) {
    return 0;
  }

  return shortage / longestRemainingMonths;
}

function getAgeGroup(plans) {
  const oldestAge = Math.max(...plans.map((plan) => plan.age));

  if (oldestAge <= 5) {
    return 'early';
  }

  if (oldestAge <= 11) {
    return 'middle';
  }

  return 'late';
}

function getDiagnosisMessage(level, ageGroup) {
  const messages = {
    good: {
      early: '現在の積立ペースなら、目標とする教育費を準備できる見込みです。\n\n今後も無理のない範囲で継続していきましょう。',
      middle: '現在の積立ペースなら、目標とする教育費を準備できる見込みです。\n\n教育方針や進路の変化に合わせて定期的に確認するのがおすすめです。',
      late: '現在の積立ペースなら、目標とする教育費を準備できる見込みです。\n\n進学が近づく時期なので、必要なタイミングで使えるよう準備状況を確認しておきましょう。',
    },
    check: {
      early: '教育費の準備は順調に進んでいます。\n\n目標まではあと少しです。\n\n今のうちに積立額を少し増やせると、将来の負担をさらに減らせそうです。',
      middle: '教育費の準備は順調です。\n\n目標まであと少しの位置にいます。\n\n毎月あと必要な金額を確認しながら、無理のない範囲で調整してみましょう。',
      late: '教育費の準備は順調です。\n\n進学までの期間を考えると、今後の積立計画を定期的に確認しておくと安心です。',
    },
    grow: {
      early: 'まだ準備期間は十分あります。\n\n現在の積立ペースでは目標額に届かない可能性がありますが、今から見直せば改善しやすい時期です。\n\n不足額と毎月あと必要な金額を確認してみましょう。',
      middle: '教育費が増え始める時期です。\n\n現在の積立ペースでは目標額に届かない可能性があります。\n\nまずは家計や積立額を見直せるポイントがないか確認してみましょう。',
      late: '大学進学までの期間が短くなっています。\n\n現在の積立ペースでは目標額に届かない可能性があります。\n\n積立額だけでなく、進路や教育費の計画もあわせて確認しておきましょう。',
    },
  };

  return messages[level][ageGroup];
}

function getDiagnosis(achievementRate, ageGroup) {
  if (achievementRate >= 100) {
    return {
      level: 'good',
      title: '🌳 順調です',
      message: getDiagnosisMessage('good', ageGroup),
    };
  }

  if (achievementRate >= 80) {
    return {
      level: 'check',
      title: '🌿 あと少しです',
      message: getDiagnosisMessage('check', ageGroup),
    };
  }

  return {
    level: 'grow',
    title: '🌱 改善が必要です',
    message: getDiagnosisMessage('grow', ageGroup),
  };
}

function updateResultMessage(shortage, plannedSavings, additionalMonthly, achievementRate, ageGroup) {
  resultMessage.hidden = false;
  shortageResultCard.hidden = false;
  resultMessage.classList.remove('good', 'check', 'grow', 'warning');
  diagnosisCard.classList.remove('good', 'check', 'grow');
  shortageResultCard.classList.remove('good', 'check', 'grow');

  const diagnosis = getDiagnosis(achievementRate, ageGroup);
  const additionalText = shortage <= 0 ? '追加積立は不要です' : `毎月あと${formatPlainYen(additionalMonthly)}必要`;

  diagnosisTitleOutput.textContent = diagnosis.title;
  diagnosisRateOutput.textContent = formatPercent(achievementRate);
  diagnosisAdditionalOutput.textContent = additionalText;
  diagnosisMessageOutput.textContent = diagnosis.message;
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

function getShareStageText(title) {
  return title.replace(/^[^\s]+\s*/, '');
}

function getShareAdditionalText(shortage, additionalMonthly) {
  if (shortage <= 0) {
    return '0円';
  }

  const manYen = additionalMonthly / 10000;
  return `約${new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 1,
  }).format(manYen)}万円`;
}

function updateCalculationDetails(plans, totalCost, currentSavings, monthlySaving, savingMethod, longestRemainingMonths, plannedSavings, additionalMonthly, shortage) {
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
  detailSavingMethod.textContent = `${savingMethod.label}（年利${savingMethod.annualRate * 100}%）`;
  detailRemainingMonths.textContent = `${longestRemainingMonths}か月`;
  detailPlannedSavings.textContent = formatManYen(plannedSavings);
  detailAdditionalMonthly.textContent = shortage <= 0 ? '追加積立は不要です' : formatPlainYen(additionalMonthly);
  detailShortage.textContent = formatManYen(shortage);
}

function calculateEducationCost() {
  const count = getVisibleChildrenCount();
  const currentSavings = getNumberValue(currentSavingsInput, 0);
  const monthlySaving = getNumberValue(monthlySavingInput, 0);
  const savingMethod = getSavingMethod();
  const plans = getChildPlans(count);
  const totalCost = plans.reduce((sum, plan) => sum + plan.courseCost, 0);
  const longestRemainingMonths = Math.max(0, ...plans.map((plan) => plan.remainingMonths));
  const plannedSavings = calculatePlannedSavings(plans);
  const shortage = Math.max(0, totalCost - plannedSavings);
  const additionalMonthly = calculateAdditionalMonthly(shortage, longestRemainingMonths);
  const achievementRate = totalCost > 0 ? (plannedSavings / totalCost) * 100 : 0;
  const ageGroup = getAgeGroup(plans);
  const diagnosis = getDiagnosis(achievementRate, ageGroup);
  const diagnosisMessage = diagnosis.message;

  totalCostOutput.textContent = formatManYen(totalCost);
  resultSavingMethodOutput.textContent = `積立方法：${savingMethod.label}`;
  plannedSavingsOutput.textContent = formatManYen(plannedSavings);
  nisaNote.hidden = savingMethod !== SAVING_METHODS.nisa;
  shortageOutput.innerHTML = shortage <= 0
    ? '<span class="shortage-line">不足はありません</span>'
    : `<span class="shortage-line">あと</span><span class="shortage-amount">${formatManYen(shortage)}</span><span class="shortage-line">不足しています</span>`;
  updateResultMessage(shortage, plannedSavings, additionalMonthly, achievementRate, ageGroup);
  updateCalculationDetails(plans, totalCost, currentSavings, monthlySaving, savingMethod, longestRemainingMonths, plannedSavings, additionalMonthly, shortage);

  latestResult = {
    stage: getShareStageText(diagnosis.title),
    rate: formatPercent(achievementRate),
    additional: getShareAdditionalText(shortage, additionalMonthly),
    message: diagnosisMessage,
  };
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
  const paragraphs = text.split('\n');
  let currentY = y;

  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      currentY += lineHeight * 0.72;
      return;
    }

    let line = '';
    [...paragraph].forEach((char) => {
      const testLine = line + char;
      if (context.measureText(testLine).width > maxWidth && line) {
        context.fillText(line, x, currentY);
        line = char;
        currentY += lineHeight;
        return;
      }
      line = testLine;
    });

    context.fillText(line, x, currentY);
    currentY += lineHeight;
  });

  return currentY;
}

function drawWatercolorTree(context) {
  context.save();
  context.globalAlpha = 0.38;

  const leaves = [
    [540, 445, 260, '#c9daa1'],
    [365, 570, 230, '#bdd49a'],
    [710, 570, 230, '#cfdda9'],
    [440, 760, 245, '#c8dca3'],
    [690, 770, 235, '#bed49b'],
    [540, 620, 285, '#d7dfad'],
  ];

  leaves.forEach(([x, y, radius, color]) => {
    const gradient = context.createRadialGradient(x, y, radius * 0.12, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(214, 224, 171, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  });

  context.globalAlpha = 0.24;
  context.fillStyle = '#a87958';
  context.beginPath();
  context.moveTo(500, 1310);
  context.bezierCurveTo(520, 980, 520, 760, 538, 585);
  context.bezierCurveTo(568, 760, 572, 980, 592, 1310);
  context.closePath();
  context.fill();

  context.restore();
}

function drawResultCardImage(result) {
  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 1920;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#fffaf1');
  background.addColorStop(1, '#f6eadb');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = 'rgba(255, 255, 255, 0.68)';
  context.beginPath();
  context.roundRect(78, 90, 924, 1740, 42);
  context.fill();

  drawWatercolorTree(context);

  context.textAlign = 'center';
  context.fillStyle = '#3c3a38';
  context.font = '700 56px sans-serif';
  context.fillText(result.stage, width / 2, 520);

  context.strokeStyle = 'rgba(165, 190, 91, 0.72)';
  context.lineWidth = 8;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(365, 560);
  context.lineTo(715, 560);
  context.stroke();

  context.fillStyle = '#46433f';
  context.font = '700 38px sans-serif';
  context.fillText('教育費準備率', width / 2, 660);

  context.fillStyle = '#2f2f2f';
  context.font = '500 190px sans-serif';
  context.fillText(result.rate, width / 2, 850);

  context.strokeStyle = 'rgba(190, 205, 108, 0.72)';
  context.lineWidth = 12;
  context.beginPath();
  context.moveTo(340, 895);
  context.lineTo(740, 895);
  context.stroke();

  context.fillStyle = '#46433f';
  context.font = '700 34px sans-serif';
  context.fillText('毎月あと', width / 2, 1040);

  context.fillStyle = '#34312f';
  context.font = '500 82px sans-serif';
  context.fillText(result.additional, width / 2, 1150);

  context.fillStyle = 'rgba(255, 255, 255, 0.58)';
  context.beginPath();
  context.roundRect(180, 1280, 720, 245, 24);
  context.fill();

  context.fillStyle = '#4a4743';
  context.font = '700 34px sans-serif';
  wrapCanvasText(context, result.message, width / 2, 1365, 620, 52);

  context.fillStyle = '#b5a792';
  context.font = '700 28px sans-serif';
  context.fillText('education-cost-simulator', width / 2, 1718);

  return canvas.toDataURL('image/png');
}

function createResultCard() {
  if (!latestResult) {
    return;
  }

  shareStage.textContent = latestResult.stage;
  shareRate.textContent = latestResult.rate;
  shareAdditional.textContent = latestResult.additional;
  shareMessage.textContent = latestResult.message;
  downloadResultCard.href = drawResultCardImage(latestResult);
  shareCardPanel.hidden = false;
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
  const method = params.get('method');

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

  if (method && SAVING_METHODS[method]) {
    savingMethodInputs.forEach((input) => {
      input.checked = input.value === method;
    });
  }
}

[
  childrenCountInput,
  currentSavingsInput,
  monthlySavingInput,
  ...savingMethodInputs,
  ...childAgeInputs,
  ...childCourseInputs,
].forEach((input) => {
  input.addEventListener('input', updateSimulator);
  input.addEventListener('change', updateSimulator);
});

createResultCardButton.addEventListener('click', createResultCard);

applyQueryParams();
updateSimulator();
