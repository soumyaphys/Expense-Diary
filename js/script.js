// Expense Diary v0.5
// Month-wise + Calendar placeholder foundation

const monthSelect = document.getElementById("monthSelect");
const incomeInput = document.getElementById("incomeInput");
const incomeDisplay = document.getElementById("incomeDisplay");
const remainingDisplay = document.getElementById("remainingDisplay");
const saveIncomeButton = document.getElementById("saveIncome");

const expenseDate = document.getElementById("expenseDate");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");
const expenseWallet = document.getElementById("expenseWallet");
const expenseDescription = document.getElementById("expenseDescription");
const saveExpenseButton = document.getElementById("saveExpense");

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
    const total=db.expenses.reduce((s,e)=>s+e.amount,0);
    expenseDisplay.innerText=money(total);
    remainingDisplay.innerText=money(db.income-total);

    transactionBody.innerHTML="";
    db.expenses.forEach(e=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${e.date}</td><td>${e.category}</td><td>${e.wallet}</td><td>${money(e.amount)}</td><td>${e.description}</td>`;
      transactionBody.appendChild(tr);
    });

    console.log("Calendar data:", buildCalendarTotals());
  const comparisonText = document.getElementById("comparisonText");

// বর্তমান মাস
const currentMonth = monthSelect.value;

// আগের মাস বের করা
let [year, month] = currentMonth.split("-").map(Number);

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

// আগের মাসের data

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
    const ds=`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const box=document.createElement("div");
    box.className="calendar-day";
    box.innerHTML=`<div class="date">${d}</div><div class="amount">${money(totals[ds]||0)}</div>`;
    calendar.appendChild(box);
  }
}

// override render to also render calendar
const _oldRender = render;
render = function(){
  _oldRender();
  renderCalendar();
};
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