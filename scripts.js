// Elements
const budgetInput = document.getElementById('budget');
const setBudgetBtn = document.getElementById('set-budget');
const currentBudgetDisplay = document.getElementById('current-budget');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const addExpenseBtn = document.getElementById('add-expense');
const totalSpentDisplay = document.getElementById('total-spent');
const remainingBudgetDisplay = document.getElementById('remaining-budget');
const categoryList = document.getElementById('category-list');
const dailyList = document.getElementById('daily-list');
const expenseList = document.getElementById('expense-list');

// Data
let budget = parseFloat(localStorage.getItem('budget')) || 0;
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Initialize
updateDisplay();

// Set budget
setBudgetBtn.addEventListener('click', () => {
    const newBudget = parseFloat(budgetInput.value);
    if (newBudget > 0) {
        budget = newBudget;
        localStorage.setItem('budget', budget);
        budgetInput.value = '';
        updateDisplay();
    } else {
        alert('Please enter a valid budget amount.');
    }
});

// Add expense
addExpenseBtn.addEventListener('click', () => {
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    if (amount > 0) {
        const expense = {
            amount,
            category,
            date: new Date().toLocaleDateString()
        };
        expenses.push(expense);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        amountInput.value = '';
        updateDisplay();
    } else {
        alert('Please enter a valid amount.');
    }
});

// Calculate totals
function calculateTotals() {
    const totals = { food: 0, travel: 0, other: 0 };
    let totalSpent = 0;
    expenses.forEach(expense => {
        totals[expense.category] += expense.amount;
        totalSpent += expense.amount;
    });
    return { totals, totalSpent };
}

// Calculate daily totals
function calculateDailyTotals() {
    const daily = {};
    expenses.forEach(expense => {
        if (!daily[expense.date]) daily[expense.date] = 0;
        daily[expense.date] += expense.amount;
    });
    // Sort dates descending
    return Object.entries(daily).sort((a, b) => new Date(b[0]) - new Date(a[0]));
}

// Update display
function updateDisplay() {
    currentBudgetDisplay.textContent = `Current Budget: ₹${budget.toFixed(2)}`;

    const { totals, totalSpent } = calculateTotals();

    totalSpentDisplay.textContent = `Total Spent: ₹${totalSpent.toFixed(2)}`;
    remainingBudgetDisplay.textContent = `Remaining Budget: ₹${(budget - totalSpent).toFixed(2)}`;

    categoryList.innerHTML = `
        <li>Food: ₹${totals.food.toFixed(2)}</li>
        <li>Travel: ₹${totals.travel.toFixed(2)}</li>
        <li>Other: ₹${totals.other.toFixed(2)}</li>
    `;

    const dailyTotals = calculateDailyTotals();
    dailyList.innerHTML = dailyTotals.map(([date, total]) => `<li>${date}: ₹${total.toFixed(2)}</li>`).join('');

    expenseList.innerHTML = '';
    expenses.slice(-10).reverse().forEach(expense => {
        const li = document.createElement('li');
        li.textContent = `₹${expense.amount.toFixed(2)} - ${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)} - ${expense.date}`;
        expenseList.appendChild(li);
    });
}
