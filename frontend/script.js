let currentFile = null;
let currentFileName = "";

const excelInput = document.getElementById('excelInput');
const dropZone = document.getElementById('dropZone');
const fileInfo = document.getElementById('fileInfo');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsPlaceholder = document.getElementById('resultsPlaceholder');
const resultsContent = document.getElementById('resultsContent');
const loadFileBtn = document.getElementById('loadFileBtn');

// Поля для вывода статистики
const statPositive = document.getElementById('stat_positive');
const statNegative = document.getElementById('stat_negative');
const statZero = document.getElementById('stat_zero');
const statN = document.getElementById('stat_n');
const statMean = document.getElementById('stat_mean');
const statMeanAbs = document.getElementById('stat_mean_abs');
const statVar = document.getElementById('stat_var');
const statSigma = document.getElementById('stat_sigma');
const statSkew = document.getElementById('stat_skew');
const statW = document.getElementById('stat_w');
const statP = document.getElementById('stat_p');
const conclusionTextSpan = document.getElementById('conclusionText');

fileInfo.innerHTML = 'Данные отсутствуют';
analyzeBtn.disabled = true;

function renderPlot(errors, meanVal, sigmaVal) {
    if (!errors || errors.length === 0) {
        document.getElementById('graphDiv').innerHTML =
            '<div class="text-center text-muted py-5">Нет данных для графика</div>';
        return;
    }

    if (sigmaVal === 0 || Math.max(...errors) === Math.min(...errors)) {
        const traceHist = {
            x: errors,
            type: 'histogram',
            histnorm: 'probability density',
            name: 'Эмпирическое распределение',
            marker: { color: '#5a9cce', opacity: 0.7 },
            nbinsx: 10
        };
        const layout = {
            title: 'Распределение ошибок (вырожденные данные)',
            xaxis: { title: 'Отклонение (граммы)' },
            yaxis: { title: 'Плотность вероятности' },
            annotations: [{
                text: 'Все значения одинаковы, нормальное распределение не определено',
                xref: 'paper', yref: 'paper',
                x: 0.5, y: 0.9, showarrow: false,
                font: { size: 12, color: '#d9534f' }
            }]
        };
        Plotly.newPlot('graphDiv', [traceHist], layout, { responsive: true });
        return;
    }

    const traceHist = {
        x: errors,
        type: 'histogram',
        histnorm: 'probability density',
        name: 'Эмпирическое распределение',
        marker: { color: '#5a9cce', opacity: 0.7, line: { color: '#2c5a7a', width: 1 } },
        nbinsx: 20
    };

    const xMin = Math.min(...errors);
    const xMax = Math.max(...errors);
    const step = (xMax - xMin) / 300;
    const xVals = [];
    for (let x = xMin; x <= xMax; x += step) {
        xVals.push(x);
    }
    const yVals = xVals.map(x => {
        const exponent = -Math.pow(x - meanVal, 2) / (2 * sigmaVal * sigmaVal);
        return (1 / (sigmaVal * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    });

    const traceNorm = {
        x: xVals,
        y: yVals,
        type: 'scatter',
        mode: 'lines',
        name: 'Нормальное распределение (теоретическое)',
        line: { color: '#d9534f', width: 3, dash: 'solid' }
    };

    const layout = {
        title: 'Плотность распределения ошибок упаковки',
        xaxis: { title: 'Отклонение (граммы)' },
        yaxis: { title: 'Плотность вероятности' },
        legend: { x: 0.05, y: 0.95, bgcolor: 'rgba(255,255,255,0.8)' },
        plot_bgcolor: '#fafcff',
        hovermode: 'closest'
    };

    Plotly.newPlot('graphDiv', [traceHist, traceNorm], layout, { responsive: true });
}

async function runAnalysis() {
    if (!currentFile) {
        alert("Нет файла для отправки. Сначала загрузите Excel.");
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Анализ...";

    const formData = new FormData();
    formData.append('file', currentFile);

    try {
        const response = await fetch('/api/v1/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // Заполнение таблицы
        statN.innerText = data.n;
        statPositive.innerText = data.positive;
        statNegative.innerText = data.negative;
        statZero.innerText = data.zero;
        statMean.innerText = data.mean.toFixed(4);
        statMeanAbs.innerText = data.mean_abs.toFixed(4);
        statVar.innerText = data.variance.toFixed(4);
        statSigma.innerText = data.sigma.toFixed(4);
        let skewVal = data.skewness;
        if (skewVal === null || isNaN(skewVal)) skewVal = 0;
        statSkew.innerText = skewVal.toFixed(4);
        statW.innerText = data.shapiro_w;
        statP.innerText = data.shapiro_p;

        const conclusionMsg = data.is_normal
            ? "Нет оснований отвергать гипотезу о нормальности распределения"
            : "Гипотеза отвергается: распределение статистически отличается от нормального";
        conclusionTextSpan.innerText = conclusionMsg;

        const conclusionDiv = document.getElementById('conclusionBlock');
        conclusionDiv.className = data.is_normal
            ? "alert alert-success mt-2"
            : "alert alert-danger mt-2";

        resultsPlaceholder.style.display = 'none';
        resultsContent.style.display = 'block';

        renderPlot(data.errors, data.mean, data.sigma);
    } catch (error) {
        console.error(error);
        alert("Ошибка при анализе: " + error.message);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Выполнить анализ";
    }
}

function parseExcelAndShowInfo(dataBuffer, fileName) {
    try {
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        if (!workbook.SheetNames.length) throw new Error("Файл не содержит листов");
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet);
        if (!rows || rows.length === 0) throw new Error("Лист не содержит данных");

        const firstRow = rows[0];
        const colNames = Object.keys(firstRow).map(k => k.toLowerCase());
        const required = ['id', 'nominal', 'fact'];
        const missing = required.filter(c => !colNames.includes(c));
        if (missing.length) {
            throw new Error(`Отсутствуют колонки: ${missing.join(', ')}. Требуются: id, nominal, fact`);
        }

        fileInfo.innerHTML = `Файл: ${fileName} | Записей: ${rows.length}`;
        analyzeBtn.disabled = false;
    } catch (err) {
        console.error(err);
        alert("Ошибка при чтении Excel: " + err.message);
        fileInfo.innerHTML = 'Данные отсутствуют (некорректный файл)';
        analyzeBtn.disabled = true;
        throw err;
    }
}

function handleFile(file) {
    if (!file) return;

    const fileName = file.name;
    const isExcel = /\.(xlsx|xls)$/i.test(fileName);
    if (!isExcel) {
        alert("Пожалуйста, загрузите файл Excel (.xlsx или .xls)");
        return;
    }

    currentFile = file;
    currentFileName = fileName;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            parseExcelAndShowInfo(new Uint8Array(e.target.result), fileName);
        } catch (err) {
            console.error(err);
            fileInfo.innerHTML = 'Ошибка: неверный формат или структура файла';
            analyzeBtn.disabled = true;
        }
    };
    reader.onerror = function () {
        alert("Не удалось прочитать файл");
        fileInfo.innerHTML = 'Ошибка чтения файла';
        analyzeBtn.disabled = true;
    };
    reader.readAsArrayBuffer(file);
}

function resetFileInput() {
    excelInput.value = "";
}

dropZone.addEventListener('click', () => {
    resetFileInput();
    excelInput.click();
});

loadFileBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    resetFileInput();
    excelInput.click();
});

excelInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    } else {
        fileInfo.innerHTML = 'Данные отсутствуют';
        analyzeBtn.disabled = true;
    }
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.background = "#e2eaf1";
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.background = "#ffffffcc";
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.background = "#ffffffcc";
    if (e.dataTransfer.files.length) {
        resetFileInput();
        handleFile(e.dataTransfer.files[0]);
    }
});

analyzeBtn.addEventListener('click', runAnalysis);