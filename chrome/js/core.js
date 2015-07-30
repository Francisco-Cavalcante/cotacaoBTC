/*
 * CotacaoBTC 1.1
 * https://github.com/ch1c4um/cotacaoBTC
 *
 * Copyright 2015, Francisco Cavalcante
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

// Variaveis Globais
var value = 0.0;
var response = "";
var exchanges = [];
var exchangeName;
var exchangePrice;

// Função para parsear o array do Json e pegar somente o nome da Exchange e o último preço da cotação
function parse_exchanges(arr,level) {
var parsed_text = "";
if(!level) level = 0;

var level_padding = "";
for(var j=0;j<level+1;j++) level_padding += "    ";

if(typeof(arr) == 'object') {
    for(var item in arr) {
        var value = arr[item];
        if(typeof(value) == 'object') {
            parsed_text += level_padding + "'" + item + "' ...\n";
			exchangeName = item; 
            parsed_text += parse_exchanges(value,level+1);
        } else {
			if(item == 'last') { // Valor da última cotação
				parsed_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
				exchangePrice = value; 
				exchanges.push([exchangeName, exchangePrice]);
			}
        }
    }
}
	return parsed_text;
}

// Função para pegar a posição do menor preço no array
function indexOfSmallest(PriceList) {
	return PriceList.indexOf(Math.min.apply(Math, PriceList));
}

function readTicker() {
	// Consulta API do bitValor
	var xhr	= new XMLHttpRequest();
	xhr.open("GET", "http://api.bitvalor.com/v1/ticker.json");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {

				response = xhr.responseText;
				var list = JSON.parse(response);
				
				// Pega as atualizações das últimas 12 horas
				 parse_exchanges(list.ticker_12h.exchanges);
				 
				 var priceTable = [];
				 
				 // Popula array somente com os preços para pegar o menor preço posteriormente
				 for(var nAux=0; nAux < exchanges.length; nAux++){
					// Posição [*][1] = Preço
					priceTable.push(exchanges[nAux][1]);
				 }

				 var bestPricePos = indexOfSmallest(priceTable);

				 // Popula o popup com as exchanges
				 setPopupExchanges(exchanges, bestPricePos);

				 // Seta o Nome e Preço da exchange com melhor preço de compra
				 exchangeName = exchanges[bestPricePos][0];
				 exchangePrice = exchanges[bestPricePos][1];

				// Seta o melhor preço e pega posição do ponto para validar o toPrecision()
				var amount  = exchangePrice;
				var amountPos = String(amount).indexOf('.');

				if( (amountPos == -1) || (amountPos < 4) ) {
					badgeText = "" + amount.toPrecision(3);
				} else {
					badgeText = "" + amount.toPrecision(4);
				}
				
				// Cor de fundo do "badge"
				if (amount>=value){
					chrome.browserAction.setBadgeBackgroundColor({color: "#000b52"});
				} else {
					chrome.browserAction.setBadgeBackgroundColor({color: "#b80000"});
				}
				value = amount;
				
				// Setando texto no Badge
				chrome.browserAction.setBadgeText({text: badgeText});
				chrome.browserAction.setTitle({title: "O melhor preço para compra é R$" + value + " Exchange: " + exchangeName});
			}
		}
	}
	xhr.send();
}

function setPopupExchanges(json, bestPrice) {
	var resultado  = document.getElementById('result');
	var ret = '';
	
	ret = '<table style=\"width:100%\" align=\"center\">';
	for(var nAux=0;nAux<json.length;nAux++)
	{
		if(nAux == bestPrice) {
			ret += '<tr bgcolor=\"#FF0000\">';
		} else {
			ret += '<tr>';
		}
		ret += '<th width=\"10\">'+json[nAux][0]+'</th>';
		var preco = json[nAux][1];
		ret += '<td width=\"10\">  -- R$ '+preco.toFixed(2)+'</td>';
		ret += '</tr>';
	}
	ret += '</table>';
	resultado.innerHTML = ret;
	return ret;
}

function onAlarm(alarm) {
	if (alarm && alarm.name == 'refresh') {
		readTicker();
	}
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.request == "request")
			sendResponse({data: response});
	}
);

// Cria um gatilho para atualizar a cada 5 minutos.
chrome.alarms.create('refresh', {periodInMinutes: 5.0});
chrome.alarms.onAlarm.addListener(onAlarm);

// Lê o ticker.
readTicker();

(function(window,document){

	window.onload = function(){
		$(function() {
			//Evento onclick do href na legenda das exchanges no popup.html
			 $("li").on("click",function() {
				switch(this.id) {
					case 'B2U':
						window.open('https://www.bitcointoyou.com');
						break;
					case 'BAS':
						window.open('https://www.basebit.com.br/');
						break;
					case 'BIV':
						window.open('https://www.bitinvest.com.br/');
						break;
					case 'FLW':
						window.open('https://trader.flowbtc.com/#/index');
						break;
					case 'FOX':
						window.open('https://foxbit.com.br');
						break;
					case 'LOC':
						window.open('https://localbitcoins.com/');
						break;
					case 'MBT':
						window.open('https://www.mercadobitcoin.com.br/');
						break;
					case 'NEG':
						window.open('http://www.negociecoins.com.br/');
						break;
					default:
						break;
				}
			});
			
			//Evento onclick do href da versão no popup.html
			$("#version").on("click",function() {
				window.open('https://github.com/ch1c4um/cotacaoBTC');
			});
			
		}); // End Function()

	} // End window.onload
 
})(window,document);