// Expense Diary v0.5
// Month-wise + IndexedDB Storage + Backup/Restore

const monthSelect = document.getElementById("monthSelect");
const incomeInput = document.getElementById("incomeInput");
const incomeDisplay = document.getElementById("incomeDisplay");
const remainingDisplay = document.getElementById("remainingDisplay");
const saveIncomeButton = document.getElementById("saveIncome");

const categoryFilter =
    document.getElementById("categoryFilter");

const transactionSort =
    document.getElementById("transactionSort");

const transactionToggle =
    document.getElementById("transactionToggle");

const transactionContent =
    document.getElementById("transactionContent");

const transactionArrow =
    document.getElementById("transactionArrow");

const downloadPdfButton =
    document.getElementById("downloadPdfButton");

const totalSavingsDisplay =
    document.getElementById("totalSavingsDisplay");

const expenseDate =
    document.getElementById("expenseDate");

const expenseAmount =
    document.getElementById("expenseAmount");

const expenseCategory =
    document.getElementById("expenseCategory");

const expenseWallet =
    document.getElementById("expenseWallet");

const expenseDescription =
    document.getElementById("expenseDescription");

const saveExpenseButton =
    document.getElementById("saveExpense");

let expensePieChart = null;

let editingExpenseId = null;

const expenseDisplay =
    document.querySelectorAll(".card h2")[1];

const transactionBody =
    document.getElementById("transactionBody");

const resetMonthButton =
    document.getElementById("resetMonthButton");


// =====================================================
// DATABASE / STORAGE
// =====================================================

function key(){

    return "expenseDiary_" +
        monthSelect.value;

}


let db = {
    income: 0,
    expenses: []
};


let monthCache = {};

let idbReady = false;


const DB_NAME =
    "ExpenseDiaryDB";

const DB_VERSION =
    1;

const STORE_NAME =
    "months";


// =====================================================
// OPEN INDEXEDDB
// =====================================================

function openExpenseDB(){

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


        request.onupgradeneeded =
            function(){

                const database =
                    request.result;


                if(
                    !database
                    .objectStoreNames
                    .contains(STORE_NAME)
                ){

                    database.createObjectStore(
                        STORE_NAME,
                        {
                            keyPath: "month"
                        }
                    );

                }

            };


        request.onsuccess =
            function(){

                resolve(
                    request.result
                );

            };


        request.onerror =
            function(){

                reject(
                    request.error
                );

            };

    });

}


// =====================================================
// GET ALL MONTHS
// =====================================================

function idbGetAll(){

    return openExpenseDB()
        .then(database => {

            return new Promise(
                (resolve, reject) => {

                    const transaction =
                        database.transaction(
                            STORE_NAME,
                            "readonly"
                        );

                    const request =
                        transaction
                            .objectStore(
                                STORE_NAME
                            )
                            .getAll();


                    request.onsuccess =
                        function(){

                            resolve(
                                request.result ||
                                []
                            );

                        };


                    request.onerror =
                        function(){

                            reject(
                                request.error
                            );

                        };

                }
            );

        });

}


// =====================================================
// GET ONE MONTH
// =====================================================

function idbGet(month){

    return openExpenseDB()
        .then(database => {

            return new Promise(
                (resolve, reject) => {

                    const transaction =
                        database.transaction(
                            STORE_NAME,
                            "readonly"
                        );

                    const store =
                        transaction.objectStore(
                            STORE_NAME
                        );

                    const request =
                        store.get(month);


                    request.onsuccess =
                        function(){

                            resolve(
                                request.result ||
                                null
                            );

                        };


                    request.onerror =
                        function(){

                            reject(
                                request.error
                            );

                        };

                }
            );

        });

}


// =====================================================
// SAVE MONTH
// =====================================================

function idbPut(month, data){

    return openExpenseDB()
        .then(database => {

            return new Promise(
                (resolve, reject) => {

                    const transaction =
                        database.transaction(
                            STORE_NAME,
                            "readwrite"
                        );

                    const store =
                        transaction.objectStore(
                            STORE_NAME
                        );

                    const request =
                        store.put({

                            month: month,

                            income:
                                Number(
                                    data.income
                                ) || 0,

                            expenses:
                                data.expenses ||
                                []

                        });


                    request.onsuccess =
                        function(){

                            resolve();

                        };


                    request.onerror =
                        function(){

                            reject(
                                request.error
                            );

                        };

                }
            );

        });

}


// =====================================================
// DELETE MONTH
// =====================================================

function idbDelete(month){

    return openExpenseDB()
        .then(database => {

            return new Promise(
                (resolve, reject) => {

                    const transaction =
                        database.transaction(
                            STORE_NAME,
                            "readwrite"
                        );

                    const request =
                        transaction
                            .objectStore(
                                STORE_NAME
                            )
                            .delete(month);


                    request.onsuccess =
                        function(){

                            resolve();

                        };


                    request.onerror =
                        function(){

                            reject(
                                request.error
                            );

                        };

                }
            );

        });

}


// =====================================================
// NORMALIZE DATA
// =====================================================

function normalizeMonthData(data){

    data =
        data || {
            income: 0,
            expenses: []
        };


    if(!Array.isArray(data.expenses)){

        data.expenses = [];

    }


    let changed = false;


    data.expenses.forEach(e => {

        if(!e._id){

            e._id =
                Date.now() +
                Math.floor(
                    Math.random() *
                    1000000
                );

            changed = true;

        }


        e.amount =
            Number(e.amount) || 0;

    });


    return {

        data: data,

        changed: changed

    };

}


// =====================================================
// MIGRATE OLD LOCALSTORAGE DATA
// =====================================================

async function migrateLocalStorageToIndexedDB(){

    const existing =
        await idbGetAll();


    // If IndexedDB already contains data,
    // do not migrate again.

    if(existing.length > 0){

        return;

    }


    for(
        let i = 0;
        i < localStorage.length;
        i++
    ){

        const localKey =
            localStorage.key(i);


        if(
            !localKey ||
            !localKey.startsWith(
                "expenseDiary_"
            )
        ){

            continue;

        }


        const month =
            localKey.replace(
                "expenseDiary_",
                ""
            );


        try{

            const oldData =
                JSON.parse(
                    localStorage.getItem(
                        localKey
                    )
                );


            if(oldData){

                const normalized =
                    normalizeMonthData(
                        oldData
                    );


                await idbPut(
                    month,
                    normalized.data
                );


                monthCache[month] =
                    normalized.data;

            }

        }
        catch(error){

            console.warn(
                "Could not migrate:",
                localKey,
                error
            );

        }

    }

}


// =====================================================
// INITIALIZE STORAGE
// =====================================================

async function initStorage(){

    try{

        await openExpenseDB();


        // Migrate existing localStorage
        // data on first run.

        await migrateLocalStorageToIndexedDB();


        const all =
            await idbGetAll();


        monthCache = {};


        all.forEach(item => {

            monthCache[item.month] = {

                income:
                    Number(
                        item.income
                    ) || 0,

                expenses:
                    Array.isArray(
                        item.expenses
                    )
                    ? item.expenses
                    : []

            };

        });


        idbReady = true;


        await loadMonth();

    }
    catch(error){

        console.error(
            "IndexedDB error:",
            error
        );


        alert(
            "Could not initialize local storage."
        );

    }

}


// =====================================================
// LOAD CURRENT MONTH
// =====================================================

async function loadMonth(){

    if(!idbReady){

        return;

    }


    const month =
        monthSelect.value;


    let data =
        monthCache[month];


    if(!data){

        const stored =
            await idbGet(month);


        data =
            stored
            ? {

                income:
                    Number(
                        stored.income
                    ) || 0,

                expenses:
                    Array.isArray(
                        stored.expenses
                    )
                    ? stored.expenses
                    : []

              }

            : {

                income: 0,

                expenses: []

              };


        const normalized =
            normalizeMonthData(
                data
            );


        data =
            normalized.data;


        if(normalized.changed){

            await idbPut(
                month,
                data
            );

        }


        monthCache[month] =
            data;

    }


    db =
        monthCache[month];


    render();

}


// =====================================================
// SAVE CURRENT MONTH
// =====================================================

async function saveMonth(){

    const month =
        monthSelect.value;


    monthCache[month] =
        db;


    try{

        await idbPut(
            month,
            db
        );

    }
    catch(error){

        console.error(
            "Could not save:",
            error
        );


        alert(
            "Could not save the data."
        );

    }

}


// =====================================================
// MONEY FORMAT
// =====================================================

function money(x){

    return "₹ " +
        Number(x)
        .toLocaleString(
            "en-IN"
        );

}


// =====================================================
// MAIN RENDER
// =====================================================

function render(){

    incomeDisplay.innerText =
        money(db.income);


    incomeInput.value =
        db.income || "";


    const total =
        db.expenses.reduce(
            (s,e) =>
                s + e.amount,
            0
        );


    expenseDisplay.innerText =
        money(total);


    const currentSavings =
        db.income - total;


    remainingDisplay.innerText =
        money(currentSavings);


    // =================================================
    // TOTAL SAVINGS FROM PREVIOUS MONTHS
    // =================================================

    let totalSavings =
        currentSavings;


    const currentMonth =
        monthSelect.value;


    let [
        currentYear,
        currentMonthNumber
    ] =
        currentMonth
            .split("-")
            .map(Number);


    for(
        let month = 1;
        month < currentMonthNumber;
        month++
    ){

        const previousKey =
            "expenseDiary_" +
            currentYear +
            "-" +
            String(month)
                .padStart(
                    2,
                    "0"
                );


        const previousMonth =
            previousKey.replace(
                "expenseDiary_",
                ""
            );


        const previousData =
            monthCache[
                previousMonth
            ];


        if(previousData){

            const previousExpenseTotal =
                previousData.expenses.reduce(
                    (sum,e) =>
                        sum + e.amount,
                    0
                );


            const previousSavings =
                previousData.income -
                previousExpenseTotal;


            totalSavings +=
                previousSavings;

        }

    }


    if(totalSavingsDisplay){

        totalSavingsDisplay.innerText =
            "Savings: " +
            money(totalSavings);

    }


    // =================================================
    // TRANSACTIONS
    // =================================================

    transactionBody.innerHTML =
        "";


    let transactions =
        [...db.expenses];


    // =================================================
    // CATEGORY FILTER
    // =================================================

    if(
        categoryFilter &&
        categoryFilter.value !== "all"
    ){

        transactions =
            transactions.filter(
                e =>
                    e.category ===
                    categoryFilter.value
            );

    }


    // =================================================
    // SORTING
    // =================================================

    if(transactionSort){

        if(
            transactionSort.value ===
            "newest"
        ){

            transactions.sort(
                (a,b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );

        }


        else if(
            transactionSort.value ===
            "oldest"
        ){

            transactions.sort(
                (a,b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );

        }


        else if(
            transactionSort.value ===
            "categoryAZ"
        ){

            transactions.sort(
                (a,b) =>
                    a.category
                        .localeCompare(
                            b.category
                        )
            );

        }


        else if(
            transactionSort.value ===
            "categoryZA"
        ){

            transactions.sort(
                (a,b) =>
                    b.category
                        .localeCompare(
                            a.category
                        )
            );

        }


        else if(
            transactionSort.value ===
            "amountHigh"
        ){

            transactions.sort(
                (a,b) =>
                    b.amount -
                    a.amount
            );

        }


        else if(
            transactionSort.value ===
            "amountLow"
        ){

            transactions.sort(
                (a,b) =>
                    a.amount -
                    b.amount
            );

        }

    }


    // =================================================
    // DISPLAY TRANSACTIONS
    // =================================================

    transactions.forEach(e => {

        const tr =
            document.createElement(
                "tr"
            );


        tr.innerHTML =

            `<td>${e.date}</td>
             <td>${e.category}</td>
             <td>${e.wallet}</td>
             <td>${money(e.amount)}</td>
             <td>${e.description || ""}</td>
             <td>

                <button
                    class="edit-expense"
                    data-id="${e._id}">
                    ✏️
                </button>

                <button
                    class="delete-expense"
                    data-id="${e._id}">
                    🗑️
                </button>

             </td>`;


        transactionBody.appendChild(
            tr
        );

    });


    // =================================================
    // MONTH COMPARISON
    // =================================================

    console.log(
        "Calendar data:",
        buildCalendarTotals()
    );


    const comparisonText =
        document.getElementById(
            "comparisonText"
        );


    const currentMonthForComparison =
        monthSelect.value;


    let [
        year,
        month
    ] =
        currentMonthForComparison
            .split("-")
            .map(Number);


    month--;


    if(month === 0){

        month = 12;

        year--;

    }


    const previousKey =
        "expenseDiary_" +
        year +
        "-" +
        String(month)
            .padStart(
                2,
                "0"
            );


    const previousMonth =
        previousKey.replace(
            "expenseDiary_",
            ""
        );


    const previousData =
        monthCache[
            previousMonth
        ];


    const currentTotal =
        db.expenses.reduce(
            (sum,e) =>
                sum + e.amount,
            0
        );


    if(previousData){

        const previousTotal =
            previousData.expenses.reduce(
                (sum,e) =>
                    sum + e.amount,
                0
            );


        const difference =
            currentTotal -
            previousTotal;


        if(difference > 0){

            comparisonText.innerHTML =
                "🔴 ₹" +
                difference.toLocaleString(
                    "en-IN"
                ) +
                " More than last month";


            comparisonText.style.color =
                "#c62828";

        }


        else if(difference < 0){

            comparisonText.innerHTML =
                "🟢 ₹" +
                Math.abs(
                    difference
                ).toLocaleString(
                    "en-IN"
                ) +
                " Less than last month";


            comparisonText.style.color =
                "#2e7d32";

        }


        else{

            comparisonText.innerHTML =
                "🟡 Same as last month";


            comparisonText.style.color =
                "#ef6c00";

        }

    }


    else{

        comparisonText.innerHTML =
            "No previous month data";


        comparisonText.style.color =
            "#555";

    }

}


// =====================================================
// CALENDAR TOTALS
// =====================================================

function buildCalendarTotals(){

    const totals = {};


    db.expenses.forEach(e => {

        totals[e.date] =
            (totals[e.date] || 0) +
            e.amount;

    });


    return totals;

}


// =====================================================
// SAVE INCOME
// =====================================================

saveIncomeButton.onclick =
    async () => {

        if(!incomeInput.value){

            alert(
                "Enter income"
            );

            return;

        }


        db.income =
            Number(
                incomeInput.value
            );


        await saveMonth();


        render();

    };


// =====================================================
// SAVE / UPDATE EXPENSE
// =====================================================

saveExpenseButton.onclick =
    async () => {

        if(!expenseAmount.value){

            alert(
                "Enter expense"
            );

            return;

        }


        // =================================================
        // EDIT EXISTING EXPENSE
        // =================================================

        if(
            editingExpenseId !==
            null
        ){

            const expense =
                db.expenses.find(
                    e =>
                        e._id ===
                        editingExpenseId
                );


            if(expense){

                expense.date =
                    expenseDate.value ||
                    new Date()
                        .toISOString()
                        .slice(
                            0,
                            10
                        );


                expense.amount =
                    Number(
                        expenseAmount.value
                    );


                expense.category =
                    expenseCategory.value;


                expense.wallet =
                    expenseWallet.value;


                expense.description =
                    expenseDescription.value;

            }


            editingExpenseId =
                null;


            saveExpenseButton.innerText =
                "Save Expense";

        }


        // =================================================
        // ADD NEW EXPENSE
        // =================================================

        else{

            db.expenses.push({

                _id:
                    Date.now(),

                date:
                    expenseDate.value ||
                    new Date()
                        .toISOString()
                        .slice(
                            0,
                            10
                        ),

                amount:
                    Number(
                        expenseAmount.value
                    ),

                category:
                    expenseCategory.value,

                wallet:
                    expenseWallet.value,

                description:
                    expenseDescription.value

            });

        }


        await saveMonth();


        render();


        expenseAmount.value =
            "";

        expenseDescription.value =
            "";

    };


// =====================================================
// FILTER / SORT / MONTH
// =====================================================

categoryFilter.onchange =
    render;


transactionSort.onchange =
    render;


monthSelect.onchange =
    function(){

        loadMonth();

    };


// =====================================================
// CALENDAR RENDERING
// =====================================================

function renderCalendar(){

    const calendar =
        document.getElementById(
            "calendar"
        );


    if(!calendar){

        return;

    }


    calendar.innerHTML =
        "";


    const totals =
        buildCalendarTotals();


    const ym =
        monthSelect.value.split(
            "-"
        );


    const year =
        parseInt(
            ym[0]
        );


    const month =
        parseInt(
            ym[1]
        );


    const days =
        new Date(
            year,
            month,
            0
        ).getDate();


    for(
        let d = 1;
        d <= days;
        d++
    ){

        const ds =
            `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;


        const box =
            document.createElement(
                "div"
            );


        box.className =
            "calendar-day";


        const dayAmount =
            totals[ds] || 0;


        box.innerHTML = `

            <div class="date">
                ${d}
            </div>

            <div class="amount ${
                dayAmount === 0
                ? 'zero-amount'
                : 'expense-amount'
            }">

                ${money(dayAmount)}

            </div>

        `;


        box.onclick =
            function(){

                showCalendarDetails(
                    ds
                );

            };


        calendar.appendChild(
            box
        );

    }

}


// =====================================================
// PIE CHART
// =====================================================

function renderExpensePieChart(){

    const canvas =
        document.getElementById(
            "expensePieChart"
        );


    if(
        !canvas ||
        typeof Chart ===
        "undefined"
    ){

        return;

    }


    const categoryTotals =
        {};


    db.expenses.forEach(e => {

        if(
            !categoryTotals[
                e.category
            ]
        ){

            categoryTotals[
                e.category
            ] = 0;

        }


        categoryTotals[
            e.category
        ] += e.amount;

    });


    const labels =
        Object.keys(
            categoryTotals
        );


    const values =
        Object.values(
            categoryTotals
        );


    if(expensePieChart){

        expensePieChart.destroy();

    }


    if(values.length === 0){

        return;

    }


    expensePieChart =
        new Chart(
            canvas,
            {

                type: "pie",

                data: {

                    labels: labels,

                    datasets: [{

                        data: values

                    }]

                },

                options: {

                    responsive: true,

                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ){

                                        return
                                            context.label +
                                            ": ₹ " +
                                            Number(
                                                context.raw
                                            )
                                            .toLocaleString(
                                                "en-IN"
                                            );

                                    }

                            }

                        }

                    }

                }

            }
        );

}


// =====================================================
// CALENDAR DETAILS
// =====================================================

function showCalendarDetails(date){

    const details =
        document.getElementById(
            "calendarDetails"
        );


    const dayExpenses =
        db.expenses.filter(
            e =>
                e.date ===
                date
        );


    if(
        dayExpenses.length ===
        0
    ){

        details.style.display =
            "block";


        details.innerHTML = `

            <h3>
                📅 ${date}
            </h3>

            <p>
                No expense recorded
                on this date.
            </p>

        `;


        return;

    }


    // =================================================
    // CATEGORY-WISE TOTAL
    // =================================================

    const categoryTotals =
        {};


    dayExpenses.forEach(e => {

        if(
            !categoryTotals[
                e.category
            ]
        ){

            categoryTotals[
                e.category
            ] = 0;

        }


        categoryTotals[
            e.category
        ] += e.amount;

    });


    const total =
        dayExpenses.reduce(
            (sum,e) =>
                sum + e.amount,
            0
        );


    let html = `

        <h3>
            📅 ${date}
        </h3>

    `;


    Object.entries(
        categoryTotals
    ).forEach(
        ([category, amount]) => {

            html += `

                <div
                    class="calendar-detail-row"
                >

                    <span>
                        ${category}
                    </span>

                    <span></span>

                    <span>
                        ${money(amount)}
                    </span>

                </div>

            `;

        }
    );


    html += `

        <div
            class="calendar-detail-total"
        >

            Total:
            ${money(total)}

        </div>

    `;


    details.innerHTML =
        html;


    details.style.display =
        "block";

}


// =====================================================
// OVERRIDE RENDER
// =====================================================

const _oldRender =
    render;


render =
    function(){

        _oldRender();

        renderCalendar();

        renderExpensePieChart();

    };


// =====================================================
// RESET CURRENT MONTH
// =====================================================

resetMonthButton.onclick =
    function(){

        if(
            confirm(
                "Reset this month's data?"
            )
        ){

            idbDelete(
                monthSelect.value
            )
            .then(
                function(){

                    delete
                        monthCache[
                            monthSelect.value
                        ];


                    loadMonth();

                }
            );

        }

    };


// =====================================================
// SERVICE WORKER
// =====================================================

if(
    "serviceWorker" in navigator
){

    window.addEventListener(
        "load",
        function(){

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )
                .then(
                    function(){

                        console.log(
                            "Service Worker Registered"
                        );

                    }
                );

        }
    );

}


// =====================================================
// PDF DOWNLOAD
// =====================================================

downloadPdfButton.onclick =
    function(){

        const {
            jsPDF
        } =
            window.jspdf;


        const doc =
            new jsPDF();


        const monthName =
            monthSelect
                .options[
                    monthSelect
                        .selectedIndex
                ]
                .text;


        // =================================================
        // CURRENT FILTER
        // =================================================

        const selectedCategory =
            categoryFilter
            ? categoryFilter.value
            : "all";


        const categoryName =
            selectedCategory ===
            "all"
            ? "All Categories"
            : selectedCategory;


        // =================================================
        // COPY TRANSACTIONS
        // =================================================

        let transactions =
            [...db.expenses];


        // =================================================
        // APPLY CATEGORY FILTER
        // =================================================

        if(
            selectedCategory !==
            "all"
        ){

            transactions =
                transactions.filter(
                    e =>
                        e.category ===
                        selectedCategory
                );

        }


        // =================================================
        // APPLY SORTING
        // =================================================

        if(transactionSort){

            if(
                transactionSort.value ===
                "newest"
            ){

                transactions.sort(
                    (a,b) =>
                        new Date(b.date) -
                        new Date(a.date)
                );

            }


            else if(
                transactionSort.value ===
                "oldest"
            ){

                transactions.sort(
                    (a,b) =>
                        new Date(a.date) -
                        new Date(b.date)
                );

            }


            else if(
                transactionSort.value ===
                "categoryAZ"
            ){

                transactions.sort(
                    (a,b) =>
                        a.category
                            .localeCompare(
                                b.category
                            )
                );

            }


            else if(
                transactionSort.value ===
                "categoryZA"
            ){

                transactions.sort(
                    (a,b) =>
                        b.category
                            .localeCompare(
                                a.category
                            )
                );

            }


            else if(
                transactionSort.value ===
                "amountHigh"
            ){

                transactions.sort(
                    (a,b) =>
                        b.amount -
                        a.amount
                );

            }


            else if(
                transactionSort.value ===
                "amountLow"
            ){

                transactions.sort(
                    (a,b) =>
                        a.amount -
                        b.amount
                );

            }

        }


        // =================================================
        // PDF HEADER
        // =================================================

        doc.setFontSize(
            20
        );


        doc.setFont(
            undefined,
            "bold"
        );


        doc.text(
            "EXPENSE DIARY",
            105,
            20,
            {
                align:
                    "center"
            }
        );


        doc.setFontSize(
            13
        );


        doc.setFont(
            undefined,
            "normal"
        );


        doc.text(
            monthName,
            105,
            29,
            {
                align:
                    "center"
            }
        );


        doc.setFontSize(
            10
        );


        doc.text(
            "Category: " +
            categoryName,
            105,
            36,
            {
                align:
                    "center"
            }
        );


        // =================================================
        // SUMMARY
        // =================================================

        const totalExpense =
            transactions.reduce(
                (sum,e) =>
                    sum + e.amount,
                0
            );


        doc.setFontSize(
            10
        );


        doc.text(
            "Total Transactions: " +
            transactions.length,
            20,
            48
        );


        doc.text(
            "Total Expense: Rs. " +
            totalExpense
                .toLocaleString(
                    "en-IN"
                ),
            140,
            48
        );


        // =================================================
        // TABLE HEADER
        // =================================================

        let y =
            60;


        doc.setFillColor(
            21,
            101,
            192
        );


        doc.rect(
            15,
            y - 7,
            180,
            9,
            "F"
        );


        doc.setTextColor(
            255,
            255,
            255
        );


        doc.setFontSize(
            9
        );


        doc.setFont(
            undefined,
            "bold"
        );


        doc.text(
            "Date",
            19,
            y
        );


        doc.text(
            "Category",
            45,
            y
        );


        doc.text(
            "Paid From",
            85,
            y
        );


        doc.text(
            "Amount",
            125,
            y
        );


        doc.text(
            "Description",
            155,
            y
        );


        // =================================================
        // TABLE ROWS
        // =================================================

        y += 8;


        doc.setTextColor(
            40,
            40,
            40
        );


        doc.setFont(
            undefined,
            "normal"
        );


        transactions.forEach(
            (e, index) => {

                doc.setDrawColor(
                    210,
                    210,
                    210
                );


                doc.line(
                    15,
                    y + 3,
                    195,
                    y + 3
                );


                doc.setFontSize(
                    8
                );


                doc.text(
                    e.date,
                    19,
                    y
                );


                doc.text(
                    String(
                        e.category
                    ).substring(
                        0,
                        18
                    ),
                    45,
                    y
                );


                doc.text(
                    String(
                        e.wallet
                    ).substring(
                        0,
                        15
                    ),
                    85,
                    y
                );


                doc.text(
                    "Rs. " +
                    Number(
                        e.amount
                    )
                    .toLocaleString(
                        "en-IN"
                    ),
                    125,
                    y
                );


                doc.text(
                    String(
                        e.description ||
                        "-"
                    ).substring(
                        0,
                        25
                    ),
                    155,
                    y
                );


                y += 9;


                if(y > 275){

                    doc.addPage();

                    y = 20;


                    doc.setFontSize(
                        8
                    );


                    doc.setTextColor(
                        40,
                        40,
                        40
                    );

                }

            }
        );


        // =================================================
        // TOTAL
        // =================================================

        y += 5;


        doc.setDrawColor(
            21,
            101,
            192
        );


        doc.line(
            15,
            y,
            195,
            y
        );


        y += 9;


        doc.setFontSize(
            11
        );


        doc.setFont(
            undefined,
            "bold"
        );


        doc.text(
            "Total Expense: Rs. " +
            totalExpense
                .toLocaleString(
                    "en-IN"
                ),
            135,
            y
        );


        // =================================================
        // EXPENSE PIE CHART
        // =================================================

        if(expensePieChart){

            // Always start on a new page.

            doc.addPage();


            y = 25;


            const chartImage =
                expensePieChart
                    .toBase64Image();


            doc.setFontSize(
                15
            );


            doc.setFont(
                undefined,
                "bold"
            );


            doc.setTextColor(
                40,
                40,
                40
            );


            doc.text(
                "Expense Breakdown",
                105,
                y,
                {
                    align:
                        "center"
                }
            );


            y += 10;


            doc.addImage(
                chartImage,
                "PNG",
                55,
                y,
                100,
                100
            );


            y += 112;


            // Category-wise amounts

            const pdfCategoryTotals =
                {};


            transactions.forEach(
                e => {

                    if(
                        !pdfCategoryTotals[
                            e.category
                        ]
                    ){

                        pdfCategoryTotals[
                            e.category
                        ] = 0;

                    }


                    pdfCategoryTotals[
                        e.category
                    ] += e.amount;

                }
            );


            doc.setFontSize(
                10
            );


            doc.setFont(
                undefined,
                "normal"
            );


            Object.entries(
                pdfCategoryTotals
            ).forEach(
                ([category, amount]) => {

                    doc.text(
                        category,
                        55,
                        y
                    );


                    doc.text(
                        "Rs. " +
                        amount
                            .toLocaleString(
                                "en-IN"
                            ),
                        145,
                        y
                    );


                    y += 8;

                }
            );

        }


        // =================================================
        // FOOTER
        // =================================================

        const pageCount =
            doc.internal
                .getNumberOfPages();


        for(
            let i = 1;
            i <= pageCount;
            i++
        ){

            doc.setPage(
                i
            );


            doc.setFontSize(
                8
            );


            doc.setFont(
                undefined,
                "normal"
            );


            doc.setTextColor(
                110,
                110,
                110
            );


            doc.text(
                "Expense Diary",
                20,
                290
            );


            doc.text(
                "Developed by Dr. Soumya Chatterjee © 2026",
                105,
                290,
                {
                    align:
                        "center"
                }
            );


            doc.text(
                "Page " +
                i +
                " of " +
                pageCount,
                190,
                290,
                {
                    align:
                        "right"
                }
            );

        }


        // =================================================
        // SAVE PDF
        // =================================================

        const safeMonth =
            monthSelect.value
                .replace(
                    "-",
                    "_"
                );


        const safeCategory =
            selectedCategory ===
            "all"
            ? "All"
            : selectedCategory
                .replace(
                    /\s+/g,
                    "_"
                );


        doc.save(
            "Expense_Diary_" +
            safeMonth +
            "_" +
            safeCategory +
            ".pdf"
        );

    };


// =====================================================
// EDIT / DELETE
// =====================================================

document.addEventListener(
    "click",
    function(e){

        // =================================================
        // DELETE
        // =================================================

        if(
            e.target.classList
                .contains(
                    "delete-expense"
                )
        ){

            const id =
                Number(
                    e.target.dataset.id
                );


            const expense =
                db.expenses.find(
                    item =>
                        item._id ===
                        id
                );


            if(!expense){

                return;

            }


            const confirmDelete =
                confirm(
                    "Delete this transaction?\n\n" +
                    expense.category +
                    " - " +
                    money(
                        expense.amount
                    )
                );


            if(!confirmDelete){

                return;

            }


            db.expenses =
                db.expenses.filter(
                    item =>
                        item._id !==
                        id
                );


            saveMonth();


            render();

        }


        // =================================================
        // EDIT
        // =================================================

        if(
            e.target.classList
                .contains(
                    "edit-expense"
                )
        ){

            const id =
                Number(
                    e.target.dataset.id
                );


            const expense =
                db.expenses.find(
                    item =>
                        item._id ===
                        id
                );


            if(!expense){

                return;

            }


            editingExpenseId =
                id;


            expenseDate.value =
                expense.date;


            expenseAmount.value =
                expense.amount;


            expenseCategory.value =
                expense.category;


            expenseWallet.value =
                expense.wallet;


            expenseDescription.value =
                expense.description ||
                "";


            saveExpenseButton.innerText =
                "Update Expense";


            const expenseForm =
                document.querySelector(
                    ".expense-form"
                );


            if(expenseForm){

                expenseForm.scrollIntoView(
                    {
                        behavior:
                            "smooth"
                    }
                );

            }

        }

    }
);


// =====================================================
// RECENT TRANSACTIONS TOGGLE
// =====================================================

if(
    transactionToggle &&
    transactionContent &&
    transactionArrow
){

    transactionToggle.onclick =
        function(){

            if(
                transactionContent
                    .style
                    .display ===
                    "none" ||

                transactionContent
                    .style
                    .display ===
                    ""
            ){

                transactionContent
                    .style
                    .display =
                    "block";


                transactionArrow.innerText =
                    "▲";

            }

            else{

                transactionContent
                    .style
                    .display =
                    "none";


                transactionArrow.innerText =
                    "▼";

            }

        };

}


// =====================================================
// BACKUP / RESTORE
// =====================================================

function createBackupRestoreUI(){

    if(!resetMonthButton){

        return;

    }


    if(
        document.getElementById(
            "backupButton"
        )
    ){

        return;

    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.style.marginTop =
        "10px";


    wrapper.style.display =
        "flex";


    wrapper.style.gap =
        "8px";


    wrapper.style.flexWrap =
        "wrap";


    const backupButton =
        document.createElement(
            "button"
        );


    backupButton.id =
        "backupButton";


    backupButton.type =
        "button";


    backupButton.innerText =
        "💾 Backup Data";


    const restoreButton =
        document.createElement(
            "button"
        );


    restoreButton.id =
        "restoreButton";


    restoreButton.type =
        "button";


    restoreButton.innerText =
        "♻️ Restore Data";


    const restoreFile =
        document.createElement(
            "input"
        );


    restoreFile.type =
        "file";


    restoreFile.accept =
        ".json,application/json";


    restoreFile.style.display =
        "none";


    wrapper.appendChild(
        backupButton
    );


    wrapper.appendChild(
        restoreButton
    );


    wrapper.appendChild(
        restoreFile
    );


    resetMonthButton.insertAdjacentElement(
        "afterend",
        wrapper
    );


    // =================================================
    // BACKUP
    // =================================================

    backupButton.onclick =
        async function(){

            try{

                const all =
                    await idbGetAll();


                const backup = {

                    app:
                        "Expense Diary",

                    version:
                        1,

                    backupDate:
                        new Date()
                            .toISOString(),

                    months:
                        all

                };


                const blob =
                    new Blob(
                        [
                            JSON.stringify(
                                backup,
                                null,
                                2
                            )
                        ],
                        {
                            type:
                                "application/json"
                        }
                    );


                const url =
                    URL.createObjectURL(
                        blob
                    );


                const link =
                    document.createElement(
                        "a"
                    );


                const today =
                    new Date()
                        .toISOString()
                        .slice(
                            0,
                            10
                        );


                link.href =
                    url;


                link.download =
                    "Expense_Diary_Backup_" +
                    today +
                    ".json";


                document.body.appendChild(
                    link
                );


                link.click();


                document.body.removeChild(
                    link
                );


                URL.revokeObjectURL(
                    url
                );

            }
            catch(error){

                console.error(
                    error
                );


                alert(
                    "Backup could not be created."
                );

            }

        };


    // =================================================
    // RESTORE BUTTON
    // =================================================

    restoreButton.onclick =
        function(){

            restoreFile.click();

        };


    // =================================================
    // RESTORE FILE
    // =================================================

    restoreFile.onchange =
        function(event){

            const file =
                event.target.files[0];


            if(!file){

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                async function(){

                    try{

                        const backup =
                            JSON.parse(
                                reader.result
                            );


                        if(
                            !backup ||
                            !Array.isArray(
                                backup.months
                            )
                        ){

                            alert(
                                "Invalid Expense Diary backup file."
                            );


                            return;

                        }


                        const confirmed =
                            confirm(
                                "Restore this backup?\n\n" +
                                "Current Expense Diary data " +
                                "will be replaced."
                            );


                        if(!confirmed){

                            return;

                        }


                        const database =
                            await openExpenseDB();


                        const transaction =
                            database.transaction(
                                STORE_NAME,
                                "readwrite"
                            );


                        const store =
                            transaction.objectStore(
                                STORE_NAME
                            );


                        store.clear();


                        await new Promise(
                            (resolve,reject) => {

                                transaction.oncomplete =
                                    resolve;


                                transaction.onerror =
                                    function(){

                                        reject(
                                            transaction.error
                                        );

                                    };

                            }
                        );


                        monthCache = {};


                        for(
                            const item
                            of backup.months
                        ){

                            if(
                                !item ||
                                !item.month
                            ){

                                continue;

                            }


                            const normalized =
                                normalizeMonthData({

                                    income:
                                        Number(
                                            item.income
                                        ) || 0,

                                    expenses:
                                        Array.isArray(
                                            item.expenses
                                        )
                                        ? item.expenses
                                        : []

                                });


                            await idbPut(
                                item.month,
                                normalized.data
                            );


                            monthCache[
                                item.month
                            ] =
                                normalized.data;

                        }


                        await loadMonth();


                        alert(
                            "Backup restored successfully!"
                        );

                    }
                    catch(error){

                        console.error(
                            error
                        );


                        alert(
                            "Could not restore this backup file."
                        );

                    }
                    finally{

                        restoreFile.value =
                            "";

                    }

                };


            reader.readAsText(
                file
            );

        };

}


// =====================================================
// START BACKUP / RESTORE UI
// =====================================================

if(
    document.readyState ===
    "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        createBackupRestoreUI
    );

}
else{

    createBackupRestoreUI();

}


// =====================================================
// START STORAGE
// =====================================================

initStorage();