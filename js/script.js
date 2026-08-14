// Expense Diary v0.5
// Month-wise + Calendar placeholder foundation

const monthSelect = document.getElementById("monthSelect");
const incomeInput = document.getElementById("incomeInput");
const incomeDisplay = document.getElementById("incomeDisplay");
const remainingDisplay = document.getElementById("remainingDisplay");
const saveIncomeButton = document.getElementById("saveIncome");

const categoryFilter = document.getElementById("categoryFilter");
const transactionSort = document.getElementById("transactionSort");

const downloadPdfButton =
    document.getElementById("downloadPdfButton");
const totalSavingsDisplay = document.getElementById("totalSavingsDisplay");

const expenseDate = document.getElementById("expenseDate");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");
const expenseWallet = document.getElementById("expenseWallet");
const expenseDescription = document.getElementById("expenseDescription");
const saveExpenseButton = document.getElementById("saveExpense");
let expensePieChart = null;
const expenseDisplay = document.querySelectorAll(".card h2")[1];
const transactionBody = document.getElementById("transactionBody");
const resetMonthButton =
document.getElementById("resetMonthButton");

function key(){ return "expenseDiary_" + monthSelect.value; }

let db={income:0,expenses:[]};

function loadMonth(){
    db = JSON.parse(localStorage.getItem(key())) || {income:0,expenses:[]};
    render();
}

function saveMonth(){
    localStorage.setItem(key(),JSON.stringify(db));
}

function money(x){ return "₹ "+Number(x).toLocaleString("en-IN"); }

function render(){
    incomeDisplay.innerText=money(db.income);
    incomeInput.value=db.income||"";

    const total = db.expenses.reduce((s,e)=>s+e.amount,0);
    expenseDisplay.innerText = money(total);

    const currentSavings = db.income - total;
    remainingDisplay.innerText = money(currentSavings);

    // -------- Total Savings from Previous Months --------
    let totalSavings = currentSavings;

    const currentMonth = monthSelect.value;
    let [currentYear, currentMonthNumber] =
        currentMonth.split("-").map(Number);

    // Add savings from all previous months of the same year
    for(let month = 1; month < currentMonthNumber; month++){

        const previousKey =
            "expenseDiary_" +
            currentYear +
            "-" +
            String(month).padStart(2,"0");

        const previousData =
            JSON.parse(localStorage.getItem(previousKey));

        if(previousData){

            const previousExpenseTotal =
                previousData.expenses.reduce(
                    (sum,e) => sum + e.amount,
                    0
                );

            const previousSavings =
                previousData.income - previousExpenseTotal;

            totalSavings += previousSavings;
        }
    }

    if(totalSavingsDisplay){
        totalSavingsDisplay.innerText =
            "Savings: " + money(totalSavings);
    }

    transactionBody.innerHTML = "";

let transactions = [...db.expenses];


// -------- Category Filter --------

if(categoryFilter && categoryFilter.value !== "all"){

    transactions = transactions.filter(e =>
        e.category === categoryFilter.value
    );

}


// -------- Sorting --------

if(transactionSort){

    if(transactionSort.value === "newest"){

        transactions.sort((a,b) =>
            new Date(b.date) - new Date(a.date)
        );

    }

    else if(transactionSort.value === "oldest"){

        transactions.sort((a,b) =>
            new Date(a.date) - new Date(b.date)
        );

    }

    else if(transactionSort.value === "categoryAZ"){

        transactions.sort((a,b) =>
            a.category.localeCompare(b.category)
        );

    }

    else if(transactionSort.value === "categoryZA"){

        transactions.sort((a,b) =>
            b.category.localeCompare(a.category)
        );

    }

    else if(transactionSort.value === "amountHigh"){

        transactions.sort((a,b) =>
            b.amount - a.amount
        );

    }

    else if(transactionSort.value === "amountLow"){

        transactions.sort((a,b) =>
            a.amount - b.amount
        );

    }

}


// -------- Display Transactions --------

transactions.forEach(e => {

    const tr = document.createElement("tr");

    tr.innerHTML =
        `<td>${e.date}</td>
         <td>${e.category}</td>
         <td>${e.wallet}</td>
         <td>${money(e.amount)}</td>
         <td>${e.description}</td>`;

    transactionBody.appendChild(tr);

});

    console.log("Calendar data:", buildCalendarTotals());
    const comparisonText = document.getElementById("comparisonText");

    const currentMonthForComparison = monthSelect.value;
    let [year, month] = currentMonthForComparison.split("-").map(Number);

    month--;

    if(month === 0){
        month = 12;
        year--;
    }

    const previousKey =
    "expenseDiary_" +
    year +
    "-" +
    String(month).padStart(2,"0");

    const previousData =
    JSON.parse(localStorage.getItem(previousKey));

    const currentTotal =
    db.expenses.reduce((sum,e)=>sum+e.amount,0);

    if(previousData){

        const previousTotal =
        previousData.expenses.reduce((sum,e)=>sum+e.amount,0);

        const difference =
        currentTotal - previousTotal;

        if(difference > 0){

            comparisonText.innerHTML =
            "🔴 ₹" +
            difference.toLocaleString("en-IN") +
            " More than last month";

            comparisonText.style.color = "#c62828";

        }

        else if(difference < 0){

            comparisonText.innerHTML =
            "🟢 ₹" +
            Math.abs(difference).toLocaleString("en-IN") +
            " Less than last month";

            comparisonText.style.color = "#2e7d32";

        }

        else{

            comparisonText.innerHTML =
            "🟡 Same as last month";

            comparisonText.style.color = "#ef6c00";

        }

    }

    else{

        comparisonText.innerHTML =
        "No previous month data";

        comparisonText.style.color = "#555";

    }
}

function buildCalendarTotals(){
    const totals={};
    db.expenses.forEach(e=>{
      totals[e.date]=(totals[e.date]||0)+e.amount;
    });
    return totals;
}

saveIncomeButton.onclick=()=>{
    if(!incomeInput.value){alert("Enter income");return;}
    db.income=Number(incomeInput.value);
    saveMonth();
    render();
};

saveExpenseButton.onclick=()=>{
    if(!expenseAmount.value){alert("Enter expense");return;}
    db.expenses.push({
      date:expenseDate.value||new Date().toISOString().slice(0,10),
      amount:Number(expenseAmount.value),
      category:expenseCategory.value,
      wallet:expenseWallet.value,
      description:expenseDescription.value
    });
    saveMonth();
    render();
    expenseAmount.value="";
    expenseDescription.value="";
};
categoryFilter.onchange = render;
transactionSort.onchange = render;
monthSelect.onchange=loadMonth;
loadMonth();

// -------- Calendar Rendering --------
function renderCalendar(){
  const calendar=document.getElementById("calendar");
  if(!calendar) return;
  calendar.innerHTML="";
  const totals=buildCalendarTotals();
  const ym=monthSelect.value.split("-");
  const year=parseInt(ym[0]), month=parseInt(ym[1]);
  const days=new Date(year,month,0).getDate();
  for(let d=1; d<=days; d++){ 

    const ds =
        `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    const box = document.createElement("div");

    box.className = "calendar-day";

    const dayAmount = totals[ds] || 0;

    box.innerHTML = `
        <div class="date">${d}</div>
        <div class="amount ${dayAmount === 0 ? 'zero-amount' : 'expense-amount'}">
            ${money(dayAmount)}
        </div>
    `;

    box.onclick = function(){

        showCalendarDetails(ds);

    };

    calendar.appendChild(box);
}
}
function renderExpensePieChart(){

    const canvas =
        document.getElementById("expensePieChart");

    if(!canvas || typeof Chart === "undefined") return;

    const categoryTotals = {};

    db.expenses.forEach(e => {

        if(!categoryTotals[e.category]){
            categoryTotals[e.category] = 0;
        }

        categoryTotals[e.category] += e.amount;

    });

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    if(expensePieChart){
        expensePieChart.destroy();
    }

    if(values.length === 0){
        return;
    }

    expensePieChart = new Chart(canvas, {

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
                    position: "bottom"
                },

                tooltip: {
                    callbacks: {

                        label: function(context){

                            return context.label +
                                ": ₹ " +
                                Number(context.raw)
                                .toLocaleString("en-IN");

                        }

                    }
                }

            }

        }

    });

}
function showCalendarDetails(date){

    const details =
        document.getElementById("calendarDetails");

    const dayExpenses =
        db.expenses.filter(e => e.date === date);

    if(dayExpenses.length === 0){

        details.style.display = "block";

        details.innerHTML = `
            <h3>📅 ${date}</h3>
            <p>No expense recorded on this date.</p>
        `;

        return;
    }

    // Category-wise total
    const categoryTotals = {};

    dayExpenses.forEach(e => {

        if(!categoryTotals[e.category]){
            categoryTotals[e.category] = 0;
        }

        categoryTotals[e.category] += e.amount;

    });

    // Total for the day
    const total =
        dayExpenses.reduce(
            (sum,e) => sum + e.amount,
            0
        );

    let html = `
        <h3>📅 ${date}</h3>
    `;

    // Show each category only once
    Object.entries(categoryTotals).forEach(
        ([category, amount]) => {

            html += `
                <div class="calendar-detail-row">
                    <span>${category}</span>
                    <span></span>
                    <span>${money(amount)}</span>
                </div>
            `;

        }
    );

    html += `
        <div class="calendar-detail-total">
            Total: ${money(total)}
        </div>
    `;

    details.innerHTML = html;

    details.style.display = "block";

}

// override render to also render calendar
const _oldRender = render;
render = function(){
  _oldRender();
  renderCalendar();
  renderExpensePieChart();
};
renderCalendar();
renderExpensePieChart();
resetMonthButton.onclick = function(){

    if(confirm("Reset this month's data?")){

        localStorage.removeItem(key());

        loadMonth();

    }

}

if ('serviceWorker' in navigator) {

    window.addEventListener('load', function(){

        navigator.serviceWorker.register('./service-worker.js')
        .then(function(){

            console.log("Service Worker Registered");

        });

    });

}

downloadPdfButton.onclick = function(){

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    const monthName =
        monthSelect.options[monthSelect.selectedIndex].text;

    // Current filter
    const selectedCategory =
        categoryFilter ? categoryFilter.value : "all";

    const categoryName =
        selectedCategory === "all"
        ? "All Categories"
        : selectedCategory;

    // Copy transactions
    let transactions = [...db.expenses];

    // Apply category filter
    if(selectedCategory !== "all"){

        transactions = transactions.filter(e =>
            e.category === selectedCategory
        );

    }

    // Apply current sorting
    if(transactionSort){

        if(transactionSort.value === "newest"){

            transactions.sort((a,b) =>
                new Date(b.date) - new Date(a.date)
            );

        }

        else if(transactionSort.value === "oldest"){

            transactions.sort((a,b) =>
                new Date(a.date) - new Date(b.date)
            );

        }

        else if(transactionSort.value === "categoryAZ"){

            transactions.sort((a,b) =>
                a.category.localeCompare(b.category)
            );

        }

        else if(transactionSort.value === "categoryZA"){

            transactions.sort((a,b) =>
                b.category.localeCompare(a.category)
            );

        }

        else if(transactionSort.value === "amountHigh"){

            transactions.sort((a,b) =>
                b.amount - a.amount
            );

        }

        else if(transactionSort.value === "amountLow"){

            transactions.sort((a,b) =>
                a.amount - b.amount
            );

        }

    }


    // ---------- PDF HEADER ----------

    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("EXPENSE DIARY", 105, 20, {align:"center"});

    doc.setFontSize(13);
    doc.setFont(undefined, "normal");
    doc.text(monthName, 105, 29, {align:"center"});

    doc.setFontSize(10);
    doc.text(
        "Category: " + categoryName,
        105,
        36,
        {align:"center"}
    );


    // ---------- SUMMARY ----------

    const totalExpense =
        transactions.reduce(
            (sum,e) => sum + e.amount,
            0
        );

    doc.setFontSize(10);

    doc.text(
        "Total Transactions: " + transactions.length,
        20,
        48
    );

    doc.text(
        "Total Expense: Rs. " +
        totalExpense.toLocaleString("en-IN"),
        140,
        48
    );


    // ---------- TABLE HEADER ----------

    let y = 60;

    doc.setFillColor(21, 101, 192);
    doc.rect(15, y - 7, 180, 9, "F");

    doc.setTextColor(255,255,255);
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");

    doc.text("Date", 19, y);
    doc.text("Category", 45, y);
    doc.text("Paid From", 85, y);
    doc.text("Amount", 125, y);
    doc.text("Description", 155, y);


    // ---------- TABLE ROWS ----------

    y += 8;

    doc.setTextColor(40,40,40);
    doc.setFont(undefined, "normal");

    transactions.forEach((e, index) => {

        // Horizontal row line
        doc.setDrawColor(210,210,210);
        doc.line(15, y + 3, 195, y + 3);

        doc.setFontSize(8);

        doc.text(e.date, 19, y);

        doc.text(
            String(e.category).substring(0, 18),
            45,
            y
        );

        doc.text(
            String(e.wallet).substring(0, 15),
            85,
            y
        );

        doc.text(
            "Rs. " + Number(e.amount).toLocaleString("en-IN"),
            125,
            y
        );

        doc.text(
            String(e.description || "-").substring(0, 25),
            155,
            y
        );

        y += 9;


        // New page if required
        if(y > 275){

            doc.addPage();

            y = 20;

            doc.setFontSize(8);
            doc.setTextColor(40,40,40);

        }

    });


    // ---------- TOTAL ----------

    y += 5;

    doc.setDrawColor(21,101,192);
    doc.line(15, y, 195, y);

    y += 9;

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");

    doc.text(
        "Total Expense: Rs. " +
        totalExpense.toLocaleString("en-IN"),
        135,
        y
    );
// ---------- EXPENSE PIE CHART ----------

if (expensePieChart) {

    // Always start Expense Breakdown on a new page
    doc.addPage();

    y = 25;

    const chartImage =
        expensePieChart.toBase64Image();

    doc.setFontSize(15);
    doc.setFont(undefined, "bold");
    doc.setTextColor(40,40,40);

    doc.text(
        "Expense Breakdown",
        105,
        y,
        { align: "center" }
    );

    y += 10;

    // Pie chart
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
    const pdfCategoryTotals = {};

    transactions.forEach(e => {

        if (!pdfCategoryTotals[e.category]) {
            pdfCategoryTotals[e.category] = 0;
        }

        pdfCategoryTotals[e.category] += e.amount;

    });

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");

    Object.entries(pdfCategoryTotals).forEach(
        ([category, amount]) => {

            doc.text(
                category,
                55,
                y
            );

            doc.text(
                "Rs. " +
                amount.toLocaleString("en-IN"),
                145,
                y
            );

            y += 8;

        }
    );

}

    // ---------- FOOTER ----------

    const pageCount = doc.internal.getNumberOfPages();

    for(let i = 1; i <= pageCount; i++){

        doc.setPage(i);

        doc.setFontSize(8);
        doc.setFont(undefined, "normal");

        doc.setTextColor(110,110,110);

        doc.text(
            "Expense Diary",
            20,
            290
        );

        doc.text(
            "Developed by Dr. Soumya Chatterjee © 2026",
            105,
            290,
            {align:"center"}
        );

        doc.text(
            "Page " + i + " of " + pageCount,
            190,
            290,
            {align:"right"}
        );

    }


    // ---------- SAVE PDF ----------

    const safeMonth =
        monthSelect.value.replace("-", "_");

    const safeCategory =
        selectedCategory === "all"
        ? "All"
        : selectedCategory.replace(/\s+/g, "_");

    doc.save(
        "Expense_Diary_" +
        safeMonth +
        "_" +
        safeCategory +
        ".pdf"
    );

};