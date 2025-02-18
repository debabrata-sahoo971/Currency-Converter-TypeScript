const amount = document.getElementById('amount') as HTMLInputElement;
const fromCurrency = document.getElementById('fromCurrency') as HTMLSelectElement;
const toCurrency = document.getElementById('toCurrency') as HTMLSelectElement;
const convertBtn = document.querySelector('.convert-btn') as HTMLButtonElement;
const result = document.getElementById('result') as HTMLDivElement;
const error = document.getElementById('error') as HTMLDivElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const updateTime = document.getElementById('updateTime') as HTMLDivElement;

type CurrencyDetails = {
    code: string;
    name: string;
    flag: string;
};

type ExchangeRateResponse = {
    result: string;
    conversion_rates: Record<string, number>;
    time_last_update_utc: string;
};

async function fetchCurrencies(): Promise<void> {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies,flags');
        const data: any[] = await response.json();
        
        const currencies = new Set<string>();
        const currencyData: CurrencyDetails[] = [];

        data.forEach(country => {
            if (country.currencies) {
                Object.entries(country.currencies).forEach(([code, details]: [string, any]) => {
                    if (!currencies.has(code)) {
                        currencies.add(code);
                        currencyData.push({
                            code,
                            name: details.name,
                            flag: country.flags.png
                        });
                    }
                });
            }
        });

        currencyData.sort((a, b) => a.code.localeCompare(b.code));

        const dropdowns = [fromCurrency, toCurrency];
        dropdowns.forEach(dropdown => {
            currencyData.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                dropdown.appendChild(option);
            });
        });

        fromCurrency.value = 'USD';
        toCurrency.value = 'INR';
    } catch (err) {
        showError('Failed to load currencies');
    }
}

async function convertCurrency(): Promise<void> {
    if (!amount.value) {
        showError('Please enter an amount');
        return;
    }

    loading.style.display = 'block';
    result.style.display = 'none';
    error.style.display = 'none';
    updateTime.style.display = 'none';

    try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/203fab4ba29184ea2a1e3165/latest/${fromCurrency.value}`);
        const data: ExchangeRateResponse = await response.json();

        if (data.result === 'success') {
            const rate = data.conversion_rates[toCurrency.value];
            if (rate) {
                const convertedAmount = (parseFloat(amount.value) * rate).toFixed(2);
                showResult(`${amount.value} ${fromCurrency.value} = ${convertedAmount} ${toCurrency.value}`);
                
                const lastUpdate = new Date(data.time_last_update_utc);
                updateTime.textContent = `Last updated: ${lastUpdate.toLocaleString()}`;
                updateTime.style.display = 'block';
            } else {
                showError('Selected currency pair is not available');
            }
        } else {
            showError('Failed to convert currency');
        }
    } catch (err) {
        showError('An error occurred, please try again later');
    } finally {
        loading.style.display = 'none';
    }
}

const showResult = (message: string): void => {
    result.style.display = 'block';
    error.style.display = 'none';
    result.textContent = message;
}

const showError = (message: string): void => {
    result.style.display = 'none';
    error.style.display = 'block';
    error.textContent = message;
    loading.style.display = 'none';
}

convertBtn.addEventListener('click', convertCurrency);
amount.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === 'Enter') convertCurrency();
});

fetchCurrencies();
