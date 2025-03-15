const fs = require("fs");
const readline = require("readline");

const RAM = 500 * 1024 * 1024;

async function simpleMergingSort(filename) {
    let k, i, j;
    let kol = 0;
    let f1Len = 0;
    let f2Len = 0;

    let streamInputFile = fs.createReadStream(filename, { encoding: "utf-8" });
    let rlInputFile = readline.createInterface({ input: streamInputFile });

    // Пробегаемся первый раз по input файлу, подсчитываем количество строк, а также разбиваем их на файлы серий.
    // series_1 включает в себя каждую чентную строку, если итерация идет с нуля.
    // series_2 включает в себя каждую нечетную строку, если интерация идет с нуля.
    for await (line of rlInputFile) {
        // Если строка превышает RAM/2, то программа выдает ошибку, так как две строки, которые будут занимать RAM/2 не поместятся в памяти при их сравнении.
        if (Buffer.byteLength(line, "utf-8") > RAM / 2) throw new RangeError(`Строка превышает допустимое значение в ${RAM / 2} байт`);

        if (kol % 2 == 0) {
            fs.appendFileSync('series_1', line + "\n");
            f1Len++;
        } else {
            fs.appendFileSync('series_2', line + "\n");
            f2Len++;
        }
        kol++;
    }

    for (k = 1; k < kol; k *= 2) {
        streamF = fs.createReadStream(filename, { encoding: "utf-8" });
        rlF = readline.createInterface({ input: streamF });

        // Проверяем первая ли у нас итерация по файлам, если да, то пропускаем этот шаг, чтобы исключить одну повторную итерацию по файлу.
        if (k != 1) {
            // Очищаем файлы серий, чтобы записать в них новые значения.
            fs.writeFileSync('series_1', "");
            fs.writeFileSync('series_2', "");

            f1Len = 0;
            f2Len = 0;
            let iter = k;
            let flag = true;
            // Разбиваем input файл по парам на файлы серий в зависимости от значения k.
            // Если значние k = 2, то в series_1 идут первые две строки, а в series_2 идут следующие две строки, и так до окончания файла input. 
            for await (line of rlF) {
                if (flag) {
                    fs.appendFileSync('series_1', line + "\n");
                    f1Len++;
                    iter--;
                }

                if (!flag) {
                    fs.appendFileSync('series_2', line + "\n");
                    f2Len++;
                    iter++;
                }

                if (iter == 0 || iter == k) flag = !flag;
            }
        }

        // Отчищаем файл input
        fs.writeFileSync(filename, "", { encoding: "utf-8" });

        let f1Index = 0;
        let f2Index = 0;
        let f1Line = "";
        let f2Line = "";

        // Сортируем и записываем новые значния в файл input.
        while (f1Index < f1Len && f2Index < f2Len) {
            i = 0;
            j = 0;
            while (i < k && j < k && f1Index < f1Len && f2Index < f2Len) {
                f1Line = await getLineByIndex('series_1', f1Index);
                f2Line = await getLineByIndex('series_2', f2Index);
                if (f1Line.localeCompare(f2Line, "en", { numeric: true }) == -1) {
                    fs.appendFileSync(filename, f1Line + "\n", { encoding: "utf-8" });
                    f1Index++
                    i++;
                } else {
                    fs.appendFileSync(filename, f2Line + "\n", { encoding: "utf-8" });
                    f2Index++
                    j++;
                }
            }
            while (i < k && f1Index < f1Len) {
                f1Line = await getLineByIndex('series_1', f1Index);
                fs.appendFileSync(filename, f1Line + "\n", { encoding: "utf-8" });
                f1Index++;
                i++;
            }
            while (j < k && f2Index < f2Len) {
                f2Line = await getLineByIndex('series_2', f2Index);
                fs.appendFileSync(filename, f2Line + "\n", { encoding: "utf-8" });
                f2Index++;
                j++;
            }
        }

        while (f1Index < f1Len) {
            f1Line = await getLineByIndex('series_1', f1Index);
            fs.appendFileSync(filename, f1Line + "\n", { encoding: "utf-8" });
            f1Index++;
        }

        while (f2Index < f2Len) {
            f2Line = await getLineByIndex('series_2', f2Index);
            fs.appendFileSync(filename, f2Line + "\n", { encoding: "utf-8" });
            f2Index++;
        }
    }

    // После завершения сортировки удаляем временные файлы.
    if (fs.existsSync('series_1')) fs.unlinkSync('series_1');
    if (fs.existsSync('series_2')) fs.unlinkSync('series_2');
}

// Функция для получния строки из файла по индексу.
async function getLineByIndex(file, index) {
    const stream = fs.createReadStream(file, { encoding: "utf-8" });
    const rl = readline.createInterface({ input: stream });

    const lineByIndex = new Promise((resolve) => {
        let indexRl = 0;
        rl.on("line", (line) => {
            if (indexRl == index) {
                resolve(line);
            }
            indexRl++;
        })

        rl.on("close", () => {
            resolve("");
        })
    });

    return lineByIndex;
}

async function main() {
    let start = performance.now();
    console.log("Сортировка началась");
    await simpleMergingSort("input.txt");
    console.log(`Сортировка завершена за ${performance.now() - start} ms`);
}

try {
    main()
} catch (err) {
    console.error('Произошла ошибка:', err);
}