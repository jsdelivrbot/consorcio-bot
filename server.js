var schedule = require('node-schedule');
const $ = require('cheerio');
var request = require('request');
var express = require('express');
var send = require('gmail-send')({
	user: 'marcos.brazz@gmail.com',
  	pass: 'jqaodenahysxnkch',
  	to: 'marcos.brazz@gmail.com'
});

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

var jobtest = schedule.scheduleJob('00 9 * * *', function() {
  console.log('Executing consorcio-bot by job');
  consorciobot.start();
});

var app = express();

app.get('/check', function(req, res) {
	console.log('Executing consorcio-bot manually');
	consorciobot.start();
	res.send('Done');
}) ;



var consorciobot = {

	resumo: {
		bilhetes : []
	},

	email: {},

	start: function() {
		request({			
			url: 'http://loterias.caixa.gov.br/wps/portal/!ut/p/a1/04_Sj9CPykssy0xPLMnMz0vMAfGjzOLNDH0MPAzcDbz8vTxNDRy9_Y2NQ13CDA0MzIAKIoEKnN0dPUzMfQwMDEwsjAw8XZw8XMwtfQ0MPM2I02-AAzgaENIfrh-FqsQ9wBmoxN_FydLAGAgNTKEK8DkRrACPGwpyQyMMMj0VAYe29yM!/dl5/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_61L0H0G0J0VSC0AC4GLFAD20G0/res/id=buscaResultado/c=cacheLevelPage/=/?timestampAjax=1517163939153',
			jar: true
		}, 
		(error, response, body) => {
			var resultado = JSON.parse(body);
			if(error) {
				console.log("ERROR: " + error.message);
				this.alertaErro(error.message);
				return;
			}
			if(response.statusCode != 200) {
				error = new Error('Request Failed.\n' +
                      `Status Code: ${statusCode}`);
    			console.error(error.message);
    			this.alertaErro(error.message);
    			return;
			}
			if(resultado.mensagens) {
				error = new Error(resultado.mensagens[0]);
    			console.error(error.message);
    			this.alertaErro(error.message);
    			return;
			}
				
			var centenas = new Array();
			var centena = 0; 
			var centenaSorteada = 0;

			$([
				resultado.premios[0].premio1,
				resultado.premios[0].premio2,
				resultado.premios[0].premio3,
				resultado.premios[0].premio4,
				resultado.premios[0].premio5,

			]).each((index, premio) => {				
				this.resumo.bilhetes.push(premio);
				// console.log('Bilhete: ' + premio + '\n');
		    	centenas.push(premio.substr(2,4));
		    	centenas.push(premio.substr(1,3));    
				var pos = premio.search("162");
				if(pos == 2) {
			      centena = i*2 + 1;
				}
				else if(pos == 1){
		 			centena = i*2 + 2;
				}
				if(centena > 0 && centenaSorteada == 0) {
		      		centenaSorteada = centena;
				}
			});	
			if(centenaSorteada > 0) {
				this.resumo.centenas = centenas;
				this.resumo.centenaSorteada = centenaSorteada;
		   		this.alertarContemplacao();
			}

		});
	},

	alertarContemplacao: function() {	
	  	email.subject = 'FUI CONTEMPLADO na centena: ' + resumo.centenaSorteada + ' !!!!';
		email.html = "Bilhetes: \n\n" +
		    "<table border='1'>" +
		      "<tr>" + 
		        "<td>1. premio: " + resumo.bilhetes[0] + "</td>" + 
		        "<td>1. centena: " + resumo.centenas[0] + "</td>" + 
		        "<td>2. centena: " + resumo.centenas[1] + "</td>" +
		      "</tr>" +
		      "<tr>" + 
		        "<td>2. premio: " + resumo.bilhetes[1] + "</td>" + 
		        "<td>3. centena: " + resumo.centenas[2] + "</td>" + 
		        "<td>4. centena: " + resumo.centenas[3] + "</td>" +
		      "</tr>" +
		      "<tr>" + 
		        "<td>3. premio: " + resumo.bilhetes[2] + "</td>" + 
		        "<td>5. centena: " + resumo.centenas[4] + "</td>" + 
		        "<td>6. centena: " + resumo.centenas[5] + "</td>" +
		      "</tr>" +
		      "<tr>" + 
		        "<td>4. premio: " + resumo.bilhetes[3] + "</td>" + 
		        "<td>7. centena: " + resumo.centenas[6] + "</td>" + 
		        "<td>8. centena: " + resumo.centenas[7] + "</td>" +
		      "</tr>" +
		      "<tr>" + 
		        "<td>5. premio: " + resumo.bilhetes[4] + "</td>" + 
		        "<td>9. centena: " + resumo.centenas[8] + "</td>" + 
		        "<td>10. centena: " + resumo.centenas[9] + "</td>" +
		      "</tr>" +
		    "</table>" + 
		    "<h1>PARABÉNS PRA MIM !!</h1>";  

	  	send(email);
	},

	alertaErro: function(msg) {
		email.subject = 'Erro no consorcio-bot';
		email.text = msg;
		send(email);
	}


};

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);

console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
