var jsonfile = require('jsonfile')
var Browser = require('zombie');
var prompt = require('prompt');
var print = require('pretty-print');
var promisify = require('node-promisify')
prompt.getAsync = promisify(prompt.get)
var browser = new Browser();
var schedule = require('node-schedule');


const userConfig = jsonfile.readFileSync('config.json')
print (userConfig)
var promptSchema = {
	properties: {
		productUrl: {
			description: 'product url',
			required: true,
		},
		size: {
			description: 'size if applicable (case sensitive)',
			required: false,
		},
		month: {
			description: 'month (1 - 12)',
			required: false
		},
		day: {
			description: 'day of month (1 - 31)',
			required: false
		},
		hour: {
			description: 'hour (0 - 23)',
			required: false
		},
		minute: {
			description: 'minute (0 - 59)',
			required: false
		},
		second: {
			description: 'second (0 - 59, OPTIONAL)',
			required: false
		}
	}
};



console.log("What u want fam?")
prompt.start();

var promptResult;

prompt.getAsync(promptSchema)
.then(result => {
	promptResult = result
	schedule.scheduleJob(`${promptResult.second} ${promptResult.minute} ${promptResult.hour} ${promptResult.day} ${promptResult.month} *`, function() {
	console.log('Finding product')
	browser.visit(result.productUrl)
	.then(() => {
		if (!browser.document.getElementsByName('commit')[0]) {
			console.log("Product is sold out")
			process.exit(0);
		};
	}).then(() => {
		return new Promise((resolve, reject) => {
			if (promptResult.size) {
				browser.select('select', promptResult.size)
			}
			browser.document.getElementById("cart-addf").submit();

			setTimeout(() => {
				if (browser.getCookie('cart').includes('1+item--')) {
					resolve()
				} else {
					reject('failed to add to cart')
				}
			}, 500)
		})
	}).then(() => {
		console.log('Checking out')
		return browser.visit('https://www.supremenewyork.com/checkout')
	}).then(() => {
	// const total = browser.document.getElementById("total").textContent
	// const shipping = browser.document.getElementById("shipping").textContent
	// console.log('The shipping is:', shipping)
})
	.then(() => {
		browser.select('#order_billing_country', userConfig.country)
		browser.select('#order_billing_state', userConfig.state);
		browser.fill('#order_billing_name', userConfig.name);
		browser.fill('#order_email', userConfig.email);
		browser.fill('#order_tel', userConfig.tel);
		browser.fill('#bo', userConfig.address1);
		browser.fill('#oba3', userConfig.address2);
	// browser.fill('#order_billing_address_3', userConfig.address3);
	browser.fill('#order_billing_zip', userConfig.zip);
	browser.fill('#order_billing_city', userConfig.city);

	browser.select('#credit_card_type', userConfig.cardType)
	browser.fill('#cnb', userConfig.state);
	browser.select('#credit_card_month', userConfig.exp_mo)
	browser.select('#credit_card_year', userConfig.exp_yr)
	browser.fill('#vval', userConfig.cvv);
	browser.document.getElementById("order_terms").checked = true;
	browser.document.getElementById("checkout_form").submit();
	console.log('submitted checkout form');

})

});
})