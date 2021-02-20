const Modal = {
    toggle() {
        document
            .querySelector('.modal-overlay')
            .classList
            .toggle('active')
    }
}

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem("dev.finances:transactions")) || []
    },

    set(transactions) {
        localStorage.setItem("dev.finances:transactions", JSON.stringify(transactions))
    }
}

const Transaction = {

    all: Storage.get(),

    add(transaction) {
        Transaction.all.push(transaction)
        Transaction.all.sort(Utils.sortByDate)
        App.reload()
    },

    remove(index) {
        Transaction.all.splice(index, 1)
        App.reload()
    },

    incomes() {
        let income = 0
        Transaction.all.forEach(transaction => {
            if (transaction.amount > 0) {
                income += transaction.amount
            }
        })
        return income
    },

    expenses() {
        let expense = 0
        Transaction.all.forEach(transaction => {
            if (transaction.amount < 0) {
                expense += transaction.amount
            }
        })
        return expense
    },

    total() {
        return Transaction.incomes() + Transaction.expenses()
    }
}

const DOM = {
    transactionsContainer: document.querySelector("#data-table tbody"),

    lastPeriod: undefined,

    addTransaction(transaction, index) {
        DOM.monthlyDivision(transaction)
        const tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index
        DOM.transactionsContainer.appendChild(tr)
    },

    innerHTMLTransaction(transaction, index) {
        const CSSclass = transaction.amount > 0 ? "income" : "expense"

        const amount = Utils.formatCurrency(transaction.amount)

        const html = `
        <td class="description">${transaction.description}</td>
        <td class="${CSSclass}">${amount}</td>
        <td class="date">${transaction.date}</td>
        <td>
            <img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação">
        </td>
        `
        return html
    },

    monthlyDivision(transaction) {
        const separator = Utils.getMonthAndYearString(transaction)
        if (!DOM.lastPeriod || (DOM.lastPeriod !== separator)) {
            const tr = document.createElement('tr')
            tr.innerHTML = `
            <td style="background: none; text-align: center;" colspan="4">
                ${separator}
            </td>
            `
            DOM.lastPeriod = separator
            DOM.transactionsContainer.appendChild(tr)
            return undefined
        } else if (DOM.lastPeriod === separator) {
            return undefined
        }
    },


    updateBalance() {
        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.incomes())
        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.expenses())
        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.total())
    },

    clearTransactions() {
        DOM.lastPeriod = undefined
        DOM.transactionsContainer.innerHTML = ""
    }
}

const Utils = {
    formatCurrency(value) {
        const sign = Number(value) < 0 ? "-" : ""
        value = String(value).replace(/\D/g, "")
        value = Number(value) / 100
        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
        return sign + value
    },

    formatAmount(value) {
        value = Number(value) * 100
        return Math.round(value)
    },

    formatDate(date) {
        const splitDate = date.split("-")
        return `${splitDate[2]}/${splitDate[1]}/${splitDate[0]}`
    },

    setCurrentDate() {
        const currDate = new Date()
        const dateInputValue = document.querySelector('input[type="date"]')
        const year = currDate.getFullYear()
        const month = ('0' + (currDate.getMonth() + 1)).slice(-2)
        const date = ('0' + currDate.getDate()).slice(-2)
        dateInputValue.value = `${year}-${month}-${date}`
    },

    sortByDate(A, B) {
        const [date1, month1, year1] = A.date.split("/")
        const [date2, month2, year2] = B.date.split("/")
        const dateA = new Date(year1, month1, date1)
        const dateB = new Date(year2, month2, date2)
        // B - A for descending order
        return dateB - dateA
    },

    months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],

    getMonthAndYearString(transaction) {
        const date = transaction.date.split("/")
        const month = Number(date[1]) - 1

        return `${Utils.months[month]} de ${date[2]}`
    }
}

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),
    
    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value
        }
    },
    
    validateFields() {
        const { description, amount, date } = Form.getValues()
        if( description.trim() === "" ||
        amount.trim() === "" || 
        date.trim() === "" ) {
            throw new Error("Por favor, preencha todos os campos!")
        }
    },
    
    formatValues() {
        let { description, amount, date } = Form.getValues()
        amount = Utils.formatAmount(amount)
        date = Utils.formatDate(date)
        return {
            description,
            amount,
            date
        }
    },
    
    clearFields() {
        Form.description.value = "",
        Form.amount.value = "",
        Form.date.value = ""
    },
    
    submit(event) {
        event.preventDefault()
        try {
            Form.validateFields()
            const transaction = Form.formatValues()
            Transaction.add(transaction)
            Form.clearFields()
            Modal.toggle()
        } catch (error) {
            alert(error.message)
        }
    }
}

const App = {
    init() {
        Transaction.all.forEach(DOM.addTransaction)
        DOM.updateBalance()
        Storage.set(Transaction.all)   
    },

    reload() {
        DOM.clearTransactions()
        App.init()
    }
}

App.init()