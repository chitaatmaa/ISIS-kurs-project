from analyzer import analyze_file


def main():
    path = input("Введите путь к Excel файлу: ").strip()

    try:
        analyze_file(path)
    except Exception as e:
        print(f"Ошибка: {e}")


if __name__ == "__main__":
    main()