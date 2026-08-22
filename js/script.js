// Expense Diary v0.5
// Month-wise + IndexedDB Storage + Backup/Restore
// Income entries with date-wise breakdown

const monthSelect =
    document.getElementById("monthSelect");

const incomeInput =
    document.getElementById("incomeInput");

const incomeDate =
    document.getElementById("incomeDate");

const incomeBreakdown =
    document.getElementById("incomeBreakdown");

const incomeDisplay =
    document.getElementById("incomeDisplay");

const remainingDisplay =
    document.getElementById("remainingDisplay");

const saveIncomeButton =
    document.getElementById("saveIncome");

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

let editingIncomeId = null;

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

    incomes: [],

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

    return new Promise(
        (resolve, reject) => {

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
                            .contains(
                                STORE_NAME
                            )
                    ){

                        database.createObjectStore(
                            STORE_NAME,
                            {
                                keyPath:
                                    "month"
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

        }
    );

}


// =====================================================
// GET ALL MONTHS
// =====================================================

function idbGetAll(){

    return openExpenseDB()
        .then(
            database => {

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

            }
        );

}


// =====================================================
// GET ONE MONTH
// =====================================================

function idbGet(month){

    return openExpenseDB()
        .then(
            database => {

                return new Promise(
                    (resolve, reject) => {

                        const transaction =
                            database.transaction(
                                STORE_NAME,
                                "readonly"
                            );


                        const store =
                            transaction
                                .objectStore(
                                    STORE_NAME
                                );


                        const request =
                            store.get(
                                month
                            );


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

            }
        );

}


// =====================================================
// SAVE MONTH
// =====================================================

function idbPut(month, data){

    return openExpenseDB()
        .then(
            database => {

                return new Promise(
                    (resolve, reject) => {

                        const transaction =
                            database.transaction(
                                STORE_NAME,
                                "readwrite"
                            );


                        const store =
                            transaction
                                .objectStore(
                                    STORE_NAME
                                );


                        const request =
                            store.put({

                                month:
                                    month,

                                // Legacy total
                                // kept for compatibility

                                income:
                                    Number(
                                        data.income
                                    ) || 0,

                                incomes:
                                    Array.isArray(
                                        data.incomes
                                    )
                                    ? data.incomes
                                    : [],

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

            }
        );

}


// =====================================================
// DELETE MONTH
// =====================================================

function idbDelete(month){

    return openExpenseDB()
        .then(
            database => {

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
                                .delete(
                                    month
                                );


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

            }
        );

}


// =====================================================
// NORMALIZE DATA
// =====================================================

function normalizeMonthData(
    data,
    dataMonth
){

    data =
        data || {

            income: 0,

            incomes: [],

            expenses: []

        };


    let changed =
        false;


    // =================================================
    // INCOME MIGRATION
    // =================================================

    if(
        !Array.isArray(
            data.incomes
        )
    ){

        data.incomes = [];


        // Convert old single income
        // into one dated income entry.

        if(
            Number(data.income) > 0
        ){

            data.incomes.push({

                _id:
                    Date.now() +
                    Math.floor(
                        Math.random() *
                        1000000
                    ),

                date:
                    (
                        dataMonth ||

                        (
                            monthSelect &&
                            monthSelect.value
                            ? monthSelect.value
                            : new Date()
                                .toISOString()
                                .slice(
                                    0,
                                    7
                                )
                        )

                    ) +
                    "-01",

                amount:
                    Number(
                        data.income
                    )

            });

        }


        changed =
            true;

    }


    data.incomes.forEach(
        item => {

            if(!item._id){

                item._id =
                    Date.now() +
                    Math.floor(
                        Math.random() *
                        1000000
                    );

                changed =
                    true;

            }


            item.amount =
                Number(
                    item.amount
                ) || 0;


            if(!item.date){

                item.date =
                    (
                        dataMonth ||

                        (
                            monthSelect &&
                            monthSelect.value
                            ? monthSelect.value
                            : new Date()
                                .toISOString()
                                .slice(
                                    0,
                                    7
                                )
                        )

                    ) +
                    "-01";

                changed =
                    true;

            }

        }
    );


    // Keep legacy total synchronized.

    data.income =
        data.incomes.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.amount
                ),
            0
        );


    // =================================================
    // EXPENSE NORMALIZATION
    // =================================================

    if(
        !Array.isArray(
            data.expenses
        )
    ){

        data.expenses = [];

        changed =
            true;

    }


    data.expenses.forEach(
        e => {

            if(!e._id){

                e._id =
                    Date.now() +
                    Math.floor(
                        Math.random() *
                        1000000
                    );

                changed =
                    true;

            }


            e.amount =
                Number(
                    e.amount
                ) || 0;

        }
    );


    return {

        data:
            data,

        changed:
            changed

    };

}


// =====================================================
// MIGRATE OLD LOCALSTORAGE DATA
// =====================================================

async function migrateLocalStorageToIndexedDB(){

    const existing =
        await idbGetAll();


    if(
        existing.length > 0
    ){

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
                        oldData,
                        month
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


        await migrateLocalStorageToIndexedDB();


        const all =
            await idbGetAll();


        monthCache = {};


        all.forEach(
            item => {

                const normalized =
                    normalizeMonthData(
                        {

                            income:
                                Number(
                                    item.income
                                ) || 0,

                            incomes:
                                Array.isArray(
                                    item.incomes
                                )
                                ? item.incomes
                                : null,

                            expenses:
                                Array.isArray(
                                    item.expenses
                                )
                                ? item.expenses
                                : []

                        },
                        item.month
                    );


                monthCache[
                    item.month
                ] =
                    normalized.data;


                if(
                    normalized.changed
                ){

                    idbPut(
                        item.month,
                        normalized.data
                    );

                }

            }
        );


        idbReady =
            true;


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
        monthCache[
            month
        ];


    if(!data){

        const stored =
            await idbGet(
                month
            );


        data =
            stored
            ? {

                income:
                    Number(
                        stored.income
                    ) || 0,

                incomes:
                    Array.isArray(
                        stored.incomes
                    )
                    ? stored.incomes
                    : null,

                expenses:
                    Array.isArray(
                        stored.expenses
                    )
                    ? stored.expenses
                    : []

              }

            : {

                income:
                    0,

                incomes:
                    [],

                expenses:
                    []

              };


        const normalized =
            normalizeMonthData(
                data,
                month
            );


        data =
            normalized.data;


        if(
            normalized.changed
        ){

            await idbPut(
                month,
                data
            );

        }


        monthCache[
            month
        ] =
            data;

    }


    db =
        monthCache[
            month
        ];


    // Restrict Expense and Income dates
    // to the selected month.

    const [
        selectedYear,
        selectedMonth
    ] =
        monthSelect.value
            .split("-")
            .map(Number);


    const firstDate =
        `${selectedYear}-${String(selectedMonth).padStart(2,"0")}-01`;


    const lastDay =
        new Date(
            selectedYear,
            selectedMonth,
            0
        ).getDate();


    const lastDate =
        `${selectedYear}-${String(selectedMonth).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;


    expenseDate.min =
        firstDate;


    expenseDate.max =
        lastDate;


    if(incomeDate){

        incomeDate.min =
            firstDate;

        incomeDate.max =
            lastDate;

    }


    render();

}


// =====================================================
// SAVE CURRENT MONTH
// =====================================================

async function saveMonth(){

    const month =
        monthSelect.value;


    monthCache[
        month
    ] =
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

    // =================================================
    // INCOME TOTAL + BREAKDOWN
    // =================================================

    if(!Array.isArray(db.incomes)){

        db.incomes = [];

    }


    const incomeTotal =
        db.incomes.reduce(
            (sum, item) =>
                sum +
                Number(item.amount),
            0
        );


    // Keep legacy total synchronized.

    db.income =
        incomeTotal;


    incomeDisplay.innerText =
        money(
            incomeTotal
        );


    // Input is only for adding
    // a new income entry.

    incomeInput.value =
        "";


    renderIncomeBreakdown();


    // =================================================
    // EXPENSE TOTAL
    // =================================================

    const total =
        db.expenses.reduce(
            (s,e) =>
                s +
                Number(e.amount),
            0
        );


    expenseDisplay.innerText =
        money(
            total
        );


    // =================================================
    // REMAINING
    // =================================================

    const currentSavings =
        incomeTotal -
        total;


    remainingDisplay.innerText =
        money(
            currentSavings
        );


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

        const previousMonth =
            currentYear +
            "-" +
            String(month)
                .padStart(
                    2,
                    "0"
                );


        const previousData =
            monthCache[
                previousMonth
            ];


        if(previousData){

            const previousIncome =
                Array.isArray(
                    previousData.incomes
                )
                ? previousData.incomes.reduce(
                    (sum,item) =>
                        sum +
                        Number(
                            item.amount
                        ),
                    0
                )
                : Number(
                    previousData.income
                ) || 0;


            const previousExpenseTotal =
                previousData.expenses.reduce(
                    (sum,e) =>
                        sum +
                        Number(
                            e.amount
                        ),
                    0
                );


            const previousSavings =
                previousIncome -
                previousExpenseTotal;


            totalSavings +=
                previousSavings;

        }

    }


    if(totalSavingsDisplay){

        totalSavingsDisplay.innerText =
            "Savings: " +
            money(
                totalSavings
            );

    }


    // =================================================
    // TRANSACTIONS
    // =================================================

    transactionBody.innerHTML =
        "";


    let transactions =
        [
            ...db.expenses
        ];


    // =================================================
    // CATEGORY FILTER
    // =================================================

    if(
        categoryFilter &&
        categoryFilter.value !==
        "all"
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

    transactions.forEach(
        e => {

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

        }
    );


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


    const previousMonth =
        year +
        "-" +
        String(month)
            .padStart(
                2,
                "0"
            );


    const previousData =
        monthCache[
            previousMonth
        ];


    const currentTotal =
        db.expenses.reduce(
            (sum,e) =>
                sum +
                Number(e.amount),
            0
        );


    if(previousData){

        const previousTotal =
            previousData.expenses.reduce(
                (sum,e) =>
                    sum +
                    Number(e.amount),
                0
            );


        const difference =
            currentTotal -
            previousTotal;


        if(difference > 0){

            comparisonText.innerHTML =
                "🔴 ₹" +
                difference
                    .toLocaleString(
                        "en-IN"
                    ) +
                " More than last month";


            comparisonText.style.color =
                "#c62828";

        }


        else if(
            difference < 0
        ){

            comparisonText.innerHTML =
                "🟢 ₹" +
                Math.abs(
                    difference
                )
                .toLocaleString(
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


    // =================================================
    // CATEGORY-WISE MONTHLY COMPARISON
    // =================================================

    renderCategoryComparison();

}


// =====================================================
// INCOME BREAKDOWN
// =====================================================

function renderIncomeBreakdown(){

    if(!incomeBreakdown){

        return;

    }


    if(
        !Array.isArray(
            db.incomes
        )
    ){

        db.incomes = [];

    }


    const entries =
        [
            ...db.incomes
        ].sort(
            (a,b) =>
                new Date(a.date) -
                new Date(b.date)
        );


    if(
        entries.length === 0
    ){

        incomeBreakdown.innerHTML =
            "";

        return;

    }


    let html = `

        <div
            style="
                margin:8px 0 12px;
                font-size:13px;
            "
        >

    `;


    entries.forEach(
        item => {

            html += `

                <div
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:6px;
                        padding:5px 0;
                        border-bottom:1px solid #eeeeee;
                    "
                >

                    <span>
                        ${formatShortDate(
                            item.date
                        )}
                    </span>

                    <span
                        style="
                            font-weight:600;
                            margin-left:auto;
                        "
                    >
                        ${money(
                            item.amount
                        )}
                    </span>

                    <button
                        type="button"
                        class="edit-income"
                        data-id="${item._id}"
                        style="
                            border:none;
                            background:none;
                            cursor:pointer;
                            padding:2px 4px;
                        "
                        title="Edit income"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="delete-income"
                        data-id="${item._id}"
                        style="
                            border:none;
                            background:none;
                            cursor:pointer;
                            padding:2px 4px;
                        "
                        title="Delete income"
                    >
                        🗑️
                    </button>

                </div>

            `;

        }
    );


    html += `

        </div>

    `;


    incomeBreakdown.innerHTML =
        html;

}


// =====================================================
// SHORT DATE
// =====================================================

function formatShortDate(
    dateString
){

    if(!dateString){

        return "";

    }


    const parts =
        dateString.split(
            "-"
        );


    if(
        parts.length !== 3
    ){

        return dateString;

    }


    return (

        parts[2] +
        " " +

        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            1
        ).toLocaleString(
            "en-IN",
            {
                month:
                    "short"
            }
        )

    );

}


// =====================================================
// CATEGORY-WISE MONTHLY COMPARISON
// =====================================================

function renderCategoryComparison(){

    const container =
        document.getElementById(
            "categoryComparison"
        );


    if(!container){

        return;

    }


    container.innerHTML =
        "";


    const currentMonth =
        monthSelect.value;


    let [
        year,
        month
    ] =
        currentMonth
            .split("-")
            .map(Number);


    month--;


    if(month === 0){

        month = 12;

        year--;

    }


    const previousMonth =
        year +
        "-" +
        String(month)
            .padStart(
                2,
                "0"
            );


    const previousData =
        monthCache[
            previousMonth
        ];


    if(!previousData){

        container.innerHTML = `

            <p
                class="category-same"
            >
                No previous month data
            </p>

        `;

        return;

    }


    // =================================================
    // CURRENT MONTH TOTALS
    // =================================================

    const currentTotals =
        {};


    db.expenses.forEach(
        e => {

            currentTotals[
                e.category
            ] =
                (
                    currentTotals[
                        e.category
                    ] || 0
                ) +
                Number(
                    e.amount
                );

        }
    );


    // =================================================
    // PREVIOUS MONTH TOTALS
    // =================================================

    const previousTotals =
        {};


    previousData.expenses.forEach(
        e => {

            previousTotals[
                e.category
            ] =
                (
                    previousTotals[
                        e.category
                    ] || 0
                ) +
                Number(
                    e.amount
                );

        }
    );


    // =================================================
    // ALL CATEGORIES
    // =================================================

    const categories =
        new Set([

            ...Object.keys(
                currentTotals
            ),

            ...Object.keys(
                previousTotals
            )

        ]);


    let html = `

        <table
            class="category-comparison-table"
        >

            <thead>

                <tr>

                    <th>
                        Category
                    </th>

                    <th>
                        This Month
                    </th>

                    <th>
                        Last Month
                    </th>

                    <th>
                        Change
                    </th>

                </tr>

            </thead>

            <tbody>

    `;


    categories.forEach(
        category => {

            const current =
                currentTotals[
                    category
                ] || 0;


            const previous =
                previousTotals[
                    category
                ] || 0;


            const difference =
                current -
                previous;


            let changeText =
                "";

            let changeClass =
                "";


            if(
                difference > 0
            ){

                changeText =
                    "↑ " +
                    money(
                        difference
                    );

                changeClass =
                    "category-up";

            }


            else if(
                difference < 0
            ){

                changeText =
                    "↓ " +
                    money(
                        Math.abs(
                            difference
                        )
                    );

                changeClass =
                    "category-down";

            }


            else{

                changeText =
                    "—";

                changeClass =
                    "category-same";

            }


            html += `

                <tr>

                    <td>
                        ${category}
                    </td>

                    <td>
                        ${money(
                            current
                        )}
                    </td>

                    <td>
                        ${money(
                            previous
                        )}
                    </td>

                    <td
                        class="${changeClass}"
                    >
                        ${changeText}
                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML =
        html;

}


// =====================================================
// CALENDAR TOTALS
// =====================================================

function buildCalendarTotals(){

    const totals =
        {};


    db.expenses.forEach(
        e => {

            totals[e.date] =
                (
                    totals[e.date] ||
                    0
                ) +
                Number(
                    e.amount
                );

        }
    );


    return totals;

}


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

            <div
                class="amount ${
                    dayAmount === 0
                    ? 'zero-amount'
                    : 'expense-amount'
                }"
            >
                ${money(
                    dayAmount
                )}
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


    db.expenses.forEach(
        e => {

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
            ] += Number(
                e.amount
            );

        }
    );


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


    if(
        values.length === 0
    ){

        return;

    }


    expensePieChart =
        new Chart(
            canvas,
            {

                type:
                    "pie",

                data: {

                    labels:
                        labels,

                    datasets: [{

                        data:
                            values

                    }]

                },

                options: {

                    responsive:
                        true,

                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    }

                }

            }
        );

}


// =====================================================
// CALENDAR DETAILS
// =====================================================

function showCalendarDetails(
    date
){

    const details =
        document.getElementById(
            "calendarDetails"
        );


    if(!details){

        return;

    }


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


    dayExpenses.forEach(
        e => {

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
            ] += Number(
                e.amount
            );

        }
    );


    const total =
        dayExpenses.reduce(
            (sum,e) =>
                sum +
                Number(
                    e.amount
                ),
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
                        ${money(
                            amount
                        )}
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
            ${money(
                total
            )}

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
// SAVE INCOME
// =====================================================

saveIncomeButton.onclick =
    async () => {

        if(!incomeInput.value){

            alert(
                "Enter income amount"
            );

            return;

        }


        if(!incomeDate.value){

            alert(
                "Select income date"
            );

            return;

        }


        // Date must belong to
        // selected month.

        if(
            !incomeDate.value.startsWith(
                monthSelect.value
            )
        ){

            alert(
                "Please select a date from the selected month."
            );

            return;

        }


        if(
            !Array.isArray(
                db.incomes
            )
        ){

            db.incomes =
                [];

        }


        // =================================================
        // UPDATE EXISTING INCOME
        // =================================================

        if(
            editingIncomeId !==
            null
        ){

            const income =
                db.incomes.find(
                    item =>
                        item._id ===
                        editingIncomeId
                );


            if(income){

                income.date =
                    incomeDate.value;


                income.amount =
                    Number(
                        incomeInput.value
                    );

            }


            editingIncomeId =
                null;


            saveIncomeButton.innerText =
                "Add Income";

        }


        // =================================================
        // ADD NEW INCOME
        // =================================================

        else{

            db.incomes.push({

                _id:
                    Date.now() +
                    Math.floor(
                        Math.random() *
                        1000000
                    ),

                date:
                    incomeDate.value,

                amount:
                    Number(
                        incomeInput.value
                    )

            });

        }


        db.income =
            db.incomes.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.amount
                    ),
                0
            );


        await saveMonth();


        incomeInput.value =
            "";

        incomeDate.value =
            "";


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


        if(
            !expenseDate.value
        ){

            alert(
                "Select expense date"
            );

            return;

        }


        if(
            !expenseDate.value.startsWith(
                monthSelect.value
            )
        ){

            alert(
                "Please select a date from the selected month."
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
                    expenseDate.value;


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
                    expenseDate.value,

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

        expenseDate.value =
            "";


        if(incomeDate){

            incomeDate.value =
                "";

        }


        loadMonth();

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
// INCOME / EXPENSE EDIT + DELETE
// =====================================================

document.addEventListener(
    "click",
    async function(e){

        // =================================================
        // DELETE INCOME
        // =================================================

        if(
            e.target.classList.contains(
                "delete-income"
            )
        ){

            const id =
                Number(
                    e.target.dataset.id
                );


            const income =
                (db.incomes || []).find(
                    item =>
                        item._id === id
                );


            if(!income){

                return;

            }


            const confirmDelete =
                confirm(
                    "Delete this income?\n\n" +
                    formatShortDate(
                        income.date
                    ) +
                    " - " +
                    money(
                        income.amount
                    )
                );


            if(!confirmDelete){

                return;

            }


            db.incomes =
                db.incomes.filter(
                    item =>
                        item._id !== id
                );


            db.income =
                db.incomes.reduce(
                    (sum,item) =>
                        sum +
                        Number(
                            item.amount
                        ),
                    0
                );


            await saveMonth();


            render();


            return;

        }


        // =================================================
        // EDIT INCOME
        // =================================================

        if(
            e.target.classList.contains(
                "edit-income"
            )
        ){

            const id =
                Number(
                    e.target.dataset.id
                );


            const income =
                (db.incomes || []).find(
                    item =>
                        item._id === id
                );


            if(!income){

                return;

            }


            incomeDate.value =
                income.date;


            incomeInput.value =
                income.amount;


            editingIncomeId =
                id;


            saveIncomeButton.innerText =
                "Update Income";


            incomeDate.scrollIntoView({
                behavior:
                    "smooth",
                block:
                    "center"
            });


            return;

        }


        // =================================================
        // DELETE EXPENSE
        // =================================================

        if(
            e.target.classList.contains(
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
                        item._id === id
                );


            if(!expense){

                return;

            }


            const confirmDelete =
                confirm(
                    "Delete this expense?"
                );


            if(!confirmDelete){

                return;

            }


            db.expenses =
                db.expenses.filter(
                    item =>
                        item._id !== id
                );


            await saveMonth();


            render();


            return;

        }


        // =================================================
        // EDIT EXPENSE
        // =================================================

        if(
            e.target.classList.contains(
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
                        item._id === id
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


            expenseDate.scrollIntoView({
                behavior:
                    "smooth",
                block:
                    "center"
            });


            return;

        }

    }
);


// =====================================================
// TRANSACTION TOGGLE
// =====================================================

if(
    transactionToggle &&
    transactionContent
){

    transactionToggle.onclick =
        function(){

            const isOpen =
                transactionContent
                    .style.display !==
                "none";


            if(isOpen){

                transactionContent.style.display =
                    "none";


                if(transactionArrow){

                    transactionArrow.innerText =
                        "▼";

                }

            }

            else{

                transactionContent.style.display =
                    "block";


                if(transactionArrow){

                    transactionArrow.innerText =
                        "▲";

                }

            }

        };

}


// =====================================================
// SEARCH TRANSACTIONS
// =====================================================

const transactionSearch =
    document.getElementById(
        "transactionSearch"
    );


if(transactionSearch){

    transactionSearch.oninput =
        function(){

            const search =
                transactionSearch.value
                    .trim()
                    .toLowerCase();


            const rows =
                transactionBody
                    .querySelectorAll(
                        "tr"
                    );


            rows.forEach(
                row => {

                    const text =
                        row.innerText
                            .toLowerCase();


                    row.style.display =
                        text.includes(
                            search
                        )
                        ? ""
                        : "none";

                }
            );

        };

}


// =====================================================
// BACKUP DATA
// =====================================================

const backupButton =
    document.getElementById(
        "backupButton"
    );


if(backupButton){

    backupButton.onclick =
        async function(){

            try{

                const all =
                    await idbGetAll();


                const backup = {

                    app:
                        "Expense Diary",

                    version:
                        "0.5",

                    exportedAt:
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


                const a =
                    document.createElement(
                        "a"
                    );


                a.href =
                    url;


                a.download =
                    "Expense_Diary_Backup_" +
                    new Date()
                        .toISOString()
                        .slice(
                            0,
                            10
                        ) +
                    ".json";


                document.body.appendChild(
                    a
                );


                a.click();


                a.remove();


                URL.revokeObjectURL(
                    url
                );


                alert(
                    "Backup downloaded successfully."
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

}


// =====================================================
// RESTORE DATA
// =====================================================

const restoreButton =
    document.getElementById(
        "restoreButton"
    );


const restoreFile =
    document.getElementById(
        "restoreFile"
    );


if(
    restoreButton &&
    restoreFile
){

    restoreButton.onclick =
        function(){

            restoreFile.click();

        };


    restoreFile.onchange =
        async function(){

            const file =
                restoreFile.files[0];


            if(!file){

                return;

            }


            try{

                const text =
                    await file.text();


                const backup =
                    JSON.parse(
                        text
                    );


                if(
                    !backup.months ||
                    !Array.isArray(
                        backup.months
                    )
                ){

                    alert(
                        "Invalid backup file."
                    );

                    return;

                }


                const confirmed =
                    confirm(
                        "Restore this backup?\n\n" +
                        "Existing data for matching months will be replaced."
                    );


                if(!confirmed){

                    restoreFile.value =
                        "";

                    return;

                }


                for(
                    const item of
                    backup.months
                ){

                    if(
                        !item ||
                        !item.month
                    ){

                        continue;

                    }


                    const normalized =
                        normalizeMonthData(
                            {

                                income:
                                    Number(
                                        item.income
                                    ) || 0,

                                incomes:
                                    Array.isArray(
                                        item.incomes
                                    )
                                    ? item.incomes
                                    : null,

                                expenses:
                                    Array.isArray(
                                        item.expenses
                                    )
                                    ? item.expenses
                                    : []

                            },
                            item.month
                        );


                    await idbPut(
                        item.month,
                        normalized.data
                    );


                    monthCache[
                        item.month
                    ] =
                        normalized.data;

                }


                alert(
                    "Backup restored successfully."
                );


                await loadMonth();


            }
            catch(error){

                console.error(
                    error
                );


                alert(
                    "Could not restore this backup."
                );

            }


            restoreFile.value =
                "";

        };

}


// =====================================================
// PDF DOWNLOAD
// =====================================================

if(downloadPdfButton){

    downloadPdfButton.onclick =
        async function(){

            if(
                typeof window.jspdf ===
                "undefined"
            ){

                alert(
                    "PDF library is not loaded."
                );

                return;

            }


            const {
                jsPDF
            } =
                window.jspdf;


            const doc =
                new jsPDF();


            const currentMonth =
                monthSelect.value;


            const totalExpense =
                db.expenses.reduce(
                    (sum,e) =>
                        sum +
                        Number(
                            e.amount
                        ),
                    0
                );


            const totalIncome =
                (db.incomes || [])
                    .reduce(
                        (sum,item) =>
                            sum +
                            Number(
                                item.amount
                            ),
                        0
                    );


            // =================================================
            // HEADER
            // =================================================

            doc.setFontSize(
                18
            );


            doc.text(
                "Expense Diary",
                105,
                18,
                {
                    align:
                        "center"
                }
            );


            doc.setFontSize(
                11
            );


            doc.text(
                "Monthly Transactions",
                105,
                26,
                {
                    align:
                        "center"
                }
            );


            doc.setFontSize(
                10
            );


            doc.text(
                "Month: " +
                currentMonth,
                20,
                38
            );


            doc.text(
                "Total Income: Rs. " +
                totalIncome
                    .toLocaleString(
                        "en-IN"
                    ),
                20,
                48
            );


            doc.text(
                "Total Expense: Rs. " +
                totalExpense
                    .toLocaleString(
                        "en-IN"
                    ),
                120,
                48
            );


            // =================================================
            // INCOME BREAKDOWN
            // =================================================

            let incomeY =
                60;


            if(
                db.incomes &&
                db.incomes.length
            ){

                doc.setFontSize(
                    11
                );


                doc.text(
                    "Income Breakdown",
                    20,
                    incomeY
                );


                incomeY +=
                    7;


                doc.setFontSize(
                    9
                );


                db.incomes
                    .slice()
                    .sort(
                        (a,b) =>
                            new Date(
                                a.date
                            ) -
                            new Date(
                                b.date
                            )
                    )
                    .forEach(
                        item => {

                            doc.text(
                                formatShortDate(
                                    item.date
                                ),
                                25,
                                incomeY
                            );


                            doc.text(
                                "Rs. " +
                                Number(
                                    item.amount
                                )
                                .toLocaleString(
                                    "en-IN"
                                ),
                                70,
                                incomeY
                            );


                            incomeY +=
                                6;

                        }
                    );

            }


            // =================================================
            // TRANSACTION TABLE
            // =================================================

            let y =
                Math.max(
                    78,
                    incomeY + 8
                );


            doc.setFontSize(
                10
            );


            const startX =
                15;


            const widths = [
                25,
                32,
                32,
                28,
                63
            ];


            const headers = [
                "Date",
                "Category",
                "Wallet",
                "Amount",
                "Description"
            ];


            // Header

            let x =
                startX;


            headers.forEach(
                (header,i) => {

                    doc.rect(
                        x,
                        y,
                        widths[i],
                        8
                    );


                    doc.text(
                        header,
                        x + 2,
                        y + 5
                    );


                    x +=
                        widths[i];

                }
            );


            y +=
                8;


            doc.setFontSize(
                8
            );


            const transactions =
                [...db.expenses].sort(
                    (a,b) =>
                        new Date(a.date) -
                        new Date(b.date)
                );


            transactions.forEach(
                e => {

                    if(
                        y > 270
                    ){

                        doc.addPage();


                        y =
                            20;

                    }


                    const values = [

                        e.date,

                        e.category,

                        e.wallet,

                        "Rs. " +
                        Number(
                            e.amount
                        )
                        .toLocaleString(
                            "en-IN"
                        ),

                        e.description ||
                        ""

                    ];


                    let rowX =
                        startX;


                    values.forEach(
                        (value,i) => {

                            doc.rect(
                                rowX,
                                y,
                                widths[i],
                                8
                            );


                            doc.text(
                                String(
                                    value
                                ).substring(
                                    0,
                                    i === 4
                                    ? 35
                                    : 18
                                ),
                                rowX + 2,
                                y + 5
                            );


                            rowX +=
                                widths[i];

                        }
                    );


                    y +=
                        8;

                }
            );


            // =================================================
            // FOOTER
            // =================================================

            if(
                y > 260
            ){

                doc.addPage();

                y =
                    20;

            }


            y +=
                12;


            doc.setFontSize(
                9
            );


            doc.text(
                "Expense Diary",
                105,
                y,
                {
                    align:
                        "center"
                }
            );


            doc.text(
                "Developed by Dr. Soumya Chatterjee, 2026",
                105,
                y + 6,
                {
                    align:
                        "center"
                }
            );


            doc.save(
                "Expense_Diary_" +
                currentMonth +
                ".pdf"
            );

        };

}


// =====================================================
// SERVICE WORKER
// =====================================================

if(
    "serviceWorker" in
    navigator
){

    window.addEventListener(
        "load",
        function(){

            navigator.serviceWorker
                .register(
                    "service-worker.js"
                )
                .catch(
                    function(error){

                        console.warn(
                            "Service worker registration failed:",
                            error
                        );

                    }
                );

        }
    );

}


// =====================================================
// DEFAULT INCOME DATE
// =====================================================

function setDefaultIncomeDate(){

    if(!incomeDate){

        return;

    }


    const today =
        new Date();


    const selectedMonth =
        monthSelect.value;


    const todayMonth =
        today.toISOString()
            .slice(
                0,
                7
            );


    if(
        todayMonth ===
        selectedMonth
    ){

        incomeDate.value =
            today.toISOString()
                .slice(
                    0,
                    10
                );

    }

}


// =====================================================
// DEFAULT EXPENSE DATE
// =====================================================

function setDefaultExpenseDate(){

    if(!expenseDate){

        return;

    }


    const today =
        new Date();


    const selectedMonth =
        monthSelect.value;


    const todayMonth =
        today.toISOString()
            .slice(
                0,
                7
            );


    if(
        todayMonth ===
        selectedMonth
    ){

        expenseDate.value =
            today.toISOString()
                .slice(
                    0,
                    10
                );

    }

}


// =====================================================
// INITIALIZE APP
// =====================================================

setDefaultIncomeDate();

setDefaultExpenseDate();


// Start IndexedDB

initStorage();
// =====================================================
// FINAL SAFETY CHECKS
// =====================================================

// Keep income total synchronized whenever
// the page becomes visible again.

document.addEventListener(
    "visibilitychange",
    function(){

        if(
            !document.hidden &&
            idbReady
        ){

            loadMonth();

        }

    }
);


// =====================================================
// PREVENT WRONG-MONTH INCOME DATE
// =====================================================

if(incomeDate){

    incomeDate.addEventListener(
        "change",
        function(){

            if(
                incomeDate.value &&
                !incomeDate.value.startsWith(
                    monthSelect.value
                )
            ){

                alert(
                    "Please select a date from the selected month."
                );

                incomeDate.value =
                    "";

            }

        }
    );

}


// =====================================================
// PREVENT WRONG-MONTH EXPENSE DATE
// =====================================================

if(expenseDate){

    expenseDate.addEventListener(
        "change",
        function(){

            if(
                expenseDate.value &&
                !expenseDate.value.startsWith(
                    monthSelect.value
                )
            ){

                alert(
                    "Please select a date from the selected month."
                );

                expenseDate.value =
                    "";

            }

        }
    );

}


// =====================================================
// CLEAR INCOME EDIT MODE
// =====================================================

function cancelIncomeEdit(){

    editingIncomeId =
        null;


    incomeInput.value =
        "";


    incomeDate.value =
        "";


    saveIncomeButton.innerText =
        "Add Income";

}


// =====================================================
// ESCAPE KEY
// =====================================================

document.addEventListener(
    "keydown",
    function(e){

        if(
            e.key ===
            "Escape"
        ){

            if(
                editingIncomeId !==
                null
            ){

                cancelIncomeEdit();

            }


            if(
                editingExpenseId !==
                null
            ){

                editingExpenseId =
                    null;


                expenseAmount.value =
                    "";


                expenseDescription.value =
                    "";


                saveExpenseButton.innerText =
                    "Save Expense";

            }

        }

    }
);