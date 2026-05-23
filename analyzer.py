import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from scipy.stats import shapiro, skew, norm


def analyze_file(path: str):
    # =========================
    # 1. Чтение Excel
    # =========================
    df = pd.read_excel(path)

    required_columns = ["id", "nominal", "fact"]

    for col in required_columns:
        if col not in df.columns:
            raise Exception(f"Нет колонки {col}")

    # =========================
    # 2. Считаем отклонения
    # =========================
    df["error"] = df["fact"] - df["nominal"]

    errors = df["error"].to_numpy()

    # =========================
    # 3. Базовая статистика
    # =========================
    n = len(errors)

    mean_error = np.mean(errors)
    mean_abs_error = np.mean(np.abs(errors))

    variance = np.var(errors)
    sigma = np.std(errors)

    asymmetry = skew(errors)

    # =========================
    # 4. Shapiro-Wilk
    # =========================
    stat, p_value = shapiro(errors)

    # =========================
    # 5. Вывод в консоль
    # =========================
    print("\n======= РЕЗУЛЬТАТ =======")
    print(f"Количество строк: {n}")
    print(f"Объем выборки: {n}")
    print(f"Среднее отклонение: {mean_error:.4f}")
    print(f"Среднее модулей: {mean_abs_error:.4f}")
    print(f"Дисперсия: {variance:.4f}")
    print(f"Sigma: {sigma:.4f}")
    print(f"Асимметрия: {asymmetry:.4f}")
    print(f"Shapiro W: {stat:.4f}")
    print(f"p-value: {p_value:.4f}")

    if p_value > 0.05:
        print("Гипотеза НЕ отвергается: распределение нормальное")
    else:
        print("Гипотеза отвергается: распределение НЕ нормальное")

    # =========================
    # 6. График
    # =========================
    plt.figure(figsize=(10, 6))

    # эмпирическая гистограмма
    count, bins, _ = plt.hist(
        errors,
        bins=20,
        density=True,
        alpha=0.8,
        label="Эмпирическое"
    )

    # теоретическая кривая
    x = np.linspace(min(errors), max(errors), 1000)
    y = norm.pdf(x, mean_error, sigma)

    plt.plot(
        x,
        y,
        linewidth=3,
        label="Нормальное распределение"
    )

    plt.title("Сравнение распределений")
    plt.xlabel("Ошибка упаковки")
    plt.ylabel("Плотность")
    plt.legend()
    plt.grid()

    plt.show()