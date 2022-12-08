/*
	Planeador de Ataques/Apoios
*/
if(!$("#planer_klinow").length){
	var configuracao = configuracaoMundo();

	var info = {
		velocidade_jogo:Number($(configuracao).find("config speed").text()),
		velocidade_tropas:Number($(configuracao).find("config unit_speed").text()),
		arqueiros:Number($(configuracao).find("game archer").text()),
		paladino:Number($(configuracao).find("game knight").text()),
		linkTropas:"/game.php?&village="+game_data.village.id+"&type=own_home&mode=units&group=0&page=-1&screen=overview_villages",
		linkVisualizacaoGeral:"/game.php?",
		linkComando:"/game.php?",
		velocidade:[18,22,18,18,9,10,10,11,30,30,10,35],
		nomesTropas:["Lanceiro","Espadachim","Viking","Arqueiro","Batedor","Cavalaria leve","Arqueiro a cavalo","Cavalaria Pesada","ArÃ­ete","Catapulta","Paladino","Nobre"]
	};
	
	console.log(info)

	var carregando = true;
	var gruposCarregados = false;
	var sort_of_low = true;
	var img_tropas = image_base + "unit/";
	var minimo_numero_tropas = [];
	var tempoSaida = [];
	var tempoUltrapassado=[];
	var id=[];
	var tropas=[];
	var minhasAldeias=[];
	var nomesAldeias = [];
	var mostrarAldeias=[];
	var tabelaBB=[];
	var imagens = "spear,sword,axe,archer,spy,light,marcher,heavy,ram,catapult,knight,snob".split(",");
	var unidadesAtivas = ("111"+(info.paladino?"10":"0")).split("");
	
	if(!info.paladino){
		info.velocidade.splice(imagens.indexOf("knight"),1);
		info.nomesTropas.splice(imagens.indexOf("knight"),1);
		imagens.splice(imagens.indexOf("knight"),1); 
	}
	if(!info.arqueiros){
		info.velocidade.splice(imagens.indexOf("archer"),1);
		info.nomesTropas.splice(imagens.indexOf("archer"),1);
		imagens.splice(imagens.indexOf("archer"),1); 
		info.velocidade.splice(imagens.indexOf("marcher"),1);
		info.nomesTropas.splice(imagens.indexOf("marcher"),1);
		imagens.splice(imagens.indexOf("marcher"),1); 
	}
	propagacao = getCookie("atkjed");
	if(propagacao != ""){
		unidadesAtivas = parseInt(propagacao,36).toString(2).split("");
		while(unidadesAtivas.length<info.velocidade.length) unidadesAtivas.splice(0,0,"0");
	}
	var t = $('#serverTime').html().match(/\d+/g);
	var d = $('#serverDate').html().match(/\d+/g);
	var tempoAtual = new Date(d[2],d[1]-1,d[0],t[0],t[1],t[2]);
	if(game_data.player.sitter != 0){
		info.linkTropas="/game.php?t=" + game_data.player.id + "&village="+game_data.village.id+"&type=own_home&mode=units&group=0&page=-1&screen=overview_villages";
		info.linkVisualizacaoGeral += "t=" + game_data.player.id + "&village="+game_data.village.id+"&screen=info_village&id=";
		info.linkComando += "t=" + game_data.player.id + "&village=";
	}
	else{	
		info.linkVisualizacaoGeral += "village="+game_data.village.id+"&screen=info_village&id=";
		info.linkComando += "village=";
	}
	var todasTropas = info.linkTropas;
	var velocidade_mundo = Number((info.velocidade_jogo * info.velocidade_tropas).toFixed(5));
	for(i = 0; i < info.velocidade.length; i++){
		minimo_numero_tropas[i] = 0;
		info.velocidade[i] /= velocidade_mundo;
	}
	desenharPlanner();
	carregarInfo();
}
else
	$("#planer_klinow").remove();
void 0;

function escolherOpcoes(){
	if(carregando){$("#carregamento").html("Aguarde enquanto carrega..."); setTimeout(escolherOpcoes, 500); return;}
	if($("#escolher_tropas").is(":visible")){mudarSeta(); $("#escolher_tropas").hide(); $("#lista_tropas").show(); guardarSelecao();}
	var html=[];
	var htmlTmp =[];
	
	var maiorUnidade = -1;
	var alvo = document.getElementById('objetivoCommun').value.match(/\d+/g);
	var inputHora = document.getElementById('hora_input').value.match(/\d+/g);
	var inputData = document.getElementById('data_input').value.match(/\d+/g);
	
	$('#lista_tropas th').each(function (i) {
		if(i>info.velocidade.length) return;
		if(i && $(this).hasClass( "faded" )) unidadesAtivas[i-1]="0";
		else if(i) unidadesAtivas[i-1]="1";
	});
	setCookie("atkjed",(parseInt(unidadesAtivas.join(""),2).toString(36)),360);
	var t = $('#serverTime').html().match(/\d+/g);
	var d = $('#serverDate').html().match(/\d+/g);
	var tempoAtual = new Date(d[2],d[1]-1,d[0],t[0],t[1],t[2]);
	var tempoAlvo = new Date(inputData[2], inputData[1] - 1, inputData[0], inputHora[0], inputHora[1], inputHora[2]);
	var tempoDiferenca=(tempoAlvo-tempoAtual)/1000;
	
	var numero_aldeias = 0;
	for(i=0;i<minhasAldeias.length;i++){
		if(!mostrarAldeias[i]) continue;
		htmlTmp[i] = "<tr><td><a href="+info.linkVisualizacaoGeral+id[i]+">"+nomesAldeias[i].replace(/\s+/g, "\u00A0");+"</a>";
		tropa_mais_lenta = 0;
		tropa_possiveis = "&from=simulator";
		
		for(j=0;j<info.velocidade.length;j++){
			if(unidadesAtivas[j]=="0" || tropas[i][j]<1){ 
				htmlTmp[i] += "<td class='hidden'>"+tropas[i][j]; 
				//tropa_possiveis += "&att_"+imagens[j]+"="+0;
				continue; 
			}
			a = Math.abs(Number(alvo[0]) - minhasAldeias[i][minhasAldeias[i].length-3]);
			b = Math.abs(Number(alvo[1]) - minhasAldeias[i][minhasAldeias[i].length-2]);
			tempoDeslocacao = Math.sqrt((a * a) + (b * b)) * info.velocidade[j]*60;
			
			if(tempoDeslocacao<=tempoDiferenca){
				if(tempoDeslocacao > tropa_mais_lenta){ tropa_mais_lenta = tempoDeslocacao; maiorUnidade = j;}
				tropa_possiveis += "&att_"+imagens[j]+"="+tropas[i][j];
				htmlTmp[i] += "<td style='background-color: #C3FFA5;'>"+tropas[i][j];
			}
			else {
				//tropa_possiveis += "&att_"+imagens[j]+"="+0;
				htmlTmp[i] += "<td>"+tropas[i][j];
			}
		}
		if(tropa_mais_lenta != 0){
			tmp = new Date(tempoAlvo);
			tmp.setSeconds(tmp.getSeconds() - tropa_mais_lenta);	
			tempoSaida[numero_aldeias]=new Date(tmp);
			ddd = formatarDatas(tmp) + " Ã s " + formatarHoras(tmp);
			html[numero_aldeias]=htmlTmp[i]+"<td>"+ddd+"<td>"+0+"<td><a href='"+info.linkComando+id[i]+"&screen=place&x="+alvo[0]+"&y="+alvo[1]+tropa_possiveis+"'>Enviar</a>";
			tabelaBB[numero_aldeias]="[*]"+info.nomesTropas[maiorUnidade]+"[|] "+minhasAldeias[i][minhasAldeias[i].length-3]+"|"+minhasAldeias[i][minhasAldeias[i].length-2]+" [|] "+alvo[0]+"|"+alvo[1]+" [|] "+ddd+" [|] [url=https://"+document.URL.split("/")[2]+info.linkComando+id[i]+"&screen=place&x="+alvo[0]+"&y="+alvo[1]+tropa_possiveis+"]Enviar\n";
			numero_aldeias++;
		}
		else{
			htmlTmp[i]  = "";
		}
	}
	
	if(numero_aldeias==0) UI.InfoMessage('NÃ£o hÃ¡ aldeias a tempo...', 1500, 'error');
	$("#numero_possibilidades").html("<b>"+numero_aldeias+"/"+minhasAldeias.length+"</b>");

	for(i=0;i<html.length-1;i++){
		min = i;
		for(j=i+1;j<html.length;j++)
			if(tempoSaida[min]>tempoSaida[j])
				min = j;

		tmp = html[min];
		html[min] = html[i];
		html[i] = tmp;
		tmp = tempoSaida[min];
		tempoSaida[min] = tempoSaida[i];
		tempoSaida[i] = tmp;
		tmp = tabelaBB[min];
		tabelaBB[min] = tabelaBB[i];		
		tabelaBB[i] = tmp;
	}
	tabelaBB.splice(numero_aldeias,tabelaBB.length-numero_aldeias);
	$('#lista_tropas tbody').html(html.join("\n")+(numero_aldeias?"<tr><td id='export_bb' colspan="+(info.velocidade.length+4)+"><a href='#' onclick=\"$('#export_bb').html('<textarea cols=100 rows=2 onclick=\\'this.select()\\'>[table][**]Unidade[||]Fonte[||]Alvo[||]Hora de saÃ­da[||]Comando[/**]\\n'+tabelaBB.join('')+'[/table]</textarea>');\" ><img src='"+image_base+"igm/export.png' > Exportar CÃ³digo</a>":''));
	$('#lista_tropas tbody tr').each(function(i){
		$(this).addClass(i%2?"row_a":"row_b");
	});
	$("#carregamento").html("");
	contar();
}

function contar(){
	var t = $('#serverTime').html().match(/\d+/g);
	var d = $('#serverDate').html().match(/\d+/g);
	var tempoAtual = new Date(d[2],d[1]-1,d[0],t[0],t[1],t[2]);
	
	$('#lista_tropas tbody>tr').each(function (i) {
		tempoDiferenca = (tempoSaida[i] - tempoAtual)/1000;
		if(tempoDiferenca>60) $(this).find("td").eq(info.velocidade.length+2).html(formatarHora(tempoDiferenca));
		else $(this).find("td").eq(info.velocidade.length+2).html("<font color='red'>"+tempoDiferenca+"</font>");
	});
	
	setTimeout(contar, 1000);
}

function formatarHora(s){
	var h = Math.floor(s / 3600);
	s = s - h * 3600;
	var m = Math.floor(s / 60);
	s = s - m * 60;
	return (h) +":"+ (m<10?"0"+m:m) +":"+ (s<10?"0"+s:s);
}

function mudarGrupo(){
	$("#carregamento").html("<img src='"+image_base+"throbber.gif' />");
	tropas = [];
	id = [];
	minhasAldeias = [];
	nomesAldeias = [];
	info.linkTropas = document.getElementById('listGrup').value;
	carregarInfo();
}

function verificarTudo(source) {
	checkboxes = document.getElementsByName('selecao');
	for(var i=0, n=checkboxes.length;i<n;i++) {
		checkboxes[i].checked = source.checked;
	}
}

function definirMinimo(n){
	el = document.getElementById("escolher_tropas");
	el = el.getElementsByTagName("input");
	for(i=0;i<info.velocidade.length;i++){
		el[i].value = n;
		minimo_numero_tropas[i] = n; 
	}
}

function esconderTropas(quem,quanto){
	quanto = Number(quanto);
	minimo_numero_tropas[quem] = quanto;
	$("#escolher_tropas tr:has(td)").each(function(i){
		tt=0;
		if($(this).find("td").eq(quem+1).text()<quanto){
			$(this).hide();
			$(this).find("input").prop('checked', false);
		}
		else
			for(j=0;j<minimo_numero_tropas.length;j++)
				if($(this).find("td").eq(j+1).text()>=minimo_numero_tropas[j])
					tt++;
		if(tt==info.velocidade.length){
			$(this).show();
			$(this).find("input").prop('checked', true);
		}
		else{
			$(this).hide();
			$(this).find("input").prop('checked', false);
		} 
	});
}

function ordenarVisualizacao(quem){
	quem++;
	var selecionados = [];
	var tabela = document.getElementById("escolher_tropas");
	if(x = tabela.rows[1].cells[quem].getElementsByTagName("img")[!quem||quem==(info.velocidade.length+1)?0:1]){
		x.src = sort_of_low?image_base+"list-up.png":image_base+"list-down.png";
		sort_of_low = sort_of_low?false:true;
	}
	else{
		tabela.rows[1].cells[quem].innerHTML += "<img src='"+image_base + "list-down.png' >";
		sort_of_low = true;
	}
	for(i=0;i<tabela.rows[1].cells.length;i++){
		if(i==quem) continue;
		if(x = tabela.rows[1].cells[i].getElementsByTagName("img")[!i||i==(info.velocidade.length+1)?0:1])
			x.remove();
	}
	
	$('[name="selecao"]').each(function(){		selecionados.push($(this).is(':checked'));	});
	for(i=2;i<tabela.rows.length-1;i++){
		if(tabela.rows[i].style.display == "none") continue;
		min = i;
		for(j=i+1;j<tabela.rows.length;j++){
			if(tabela.rows[j].style.display == "none") continue;
			if(quem==0)
				if(tabela.rows[sort_of_low?j:min].cells[quem].textContent > tabela.rows[sort_of_low?min:j].cells[quem].textContent)
					min = j;	
			if(Number(tabela.rows[sort_of_low?j:min].cells[quem].textContent) > Number(tabela.rows[sort_of_low?min:j].cells[quem].textContent))
				min = j;	
		}
		tmp = tabela.rows[min].innerHTML;
		tabela.rows[min].innerHTML = tabela.rows[i].innerHTML;
		tabela.rows[i].innerHTML = tmp;
		tmp2 = selecionados[i-2];
		selecionados[i-2] = selecionados[min-2];
		selecionados[min-2] = tmp2;
	}
	$('[name="selecao"]').each(function(i){	$(this).prop('checked', selecionados[i]);	});
}

function selecionarAldeias(){
	var linha;
	
	janela = "<tr><th style=\"cursor:pointer;\" onclick=\"definirMinimo(0); $('#escolher_tropas tr:has(td)').each(function(i){$(this).show();}); \">NÃºmero minimo de tropas:";
	for(i=0;i<info.velocidade.length;i++)
		janela += "<th><input onchange=\"esconderTropas("+i+",this.value);\" type='text' value="+minimo_numero_tropas[i]+" size='1'>";

	janela += "<th colspan=2><tr><th style=\"cursor:pointer;\" onclick=\"ordenarVisualizacao("+(-1)+");\" ><span class='icon header village' ></span>";
	for(i=0;i<imagens.length;i++){
		janela += "<th style=\"cursor:pointer;\" onclick=\"ordenarVisualizacao("+i+");\" ><img src='"+img_tropas+"unit_"+imagens[i]+".png'>";
	}
	janela +="<th style=\"cursor:pointer;\" onclick=\"ordenarVisualizacao("+(imagens.length)+");\" >Dist<th><input type='checkbox' onClick='verificarTudo(this)'\" >";
	for(i=0;i<tropas.length;i++){
		escondido = false;
		komorki = "<a href="+info.linkVisualizacaoGeral+id[i]+">"+nomesAldeias[i].replace(/\s+/g, "\u00A0")+"</a>";
		for(j=0;j<imagens.length;j++){
			komorki += "<td>"+tropas[i][j];
			if(!escondido && tropas[i][j]<minimo_numero_tropas[i]) escondido = true;
		}
		if(!escondido) linha = "<tr class='"+(i%2?'row_a':'row_b')+"'><td>"; 
		else linha ="<tr class='"+(i%2?'row_a':'row_b')+"' style=\"display: none;\"><td>";
		janela += linha + komorki;
		
		janela += "<td><td><input name='selecao' type='checkbox' "+(mostrarAldeias[i]?'checked':"disabled")+">";
	}
	$('#escolher_tropas').html(janela);
	mostrarDistancia();
}

function mostrarDistancia(){
	document.getElementById('objetivoCommun').value = document.getElementById('objetivoCommun').value.match(/\d+\|\d+/);
	var cel = document.getElementById('objetivoCommun').value.match(/\d+/g);
	$("#escolher_tropas tr:has(td) td:nth-child("+(info.velocidade.length+2)+")").each(function(i){
		a = Math.abs(Number(cel[0]) - minhasAldeias[i][minhasAldeias[i].length-3]);
		b = Math.abs(Number(cel[1]) - minhasAldeias[i][minhasAldeias[i].length-2]);
		$(this).html(Number((Math.sqrt((a * a) + (b * b))).toFixed(2)));
	});
}

function guardarSelecao(){
	$('#escolher_tropas input:checkbox').each(function (i) {
		if(i) 
			mostrarAldeias[i-1] = $(this).is(':checked'); 
	});
	$('#escolher_tropas').hide();
	$("#lista_tropas").show();
}

function mudarSeta(){
	if($("#icone_seta").hasClass('arr_down')){ 
		$("#icone_seta").removeClass('arr_down'); 
		$("#icone_seta").addClass('arr_up'); 
	} 
	else{
		$("#icone_seta").removeClass('arr_up'); 
		$("#icone_seta").addClass('arr_down');
	}; 
} 

function desenharPlanner(){
	var cel = game_data.village.x + "|" + game_data.village.y;
	if(game_data.screen=="info_village"){
		if(!mobile){
			var tabela=document.getElementById("content_value").getElementsByClassName('vis')[0];
			tabela.getElementsByTagName("table")[0];
			cel = tabela.rows[2].cells[1].textContent;
		}
		else{
			tabela=document.getElementsByClassName('mobileKeyValue')[0].getElementsByTagName("div")[0]; 
			cel = tabela.textContent.match(/\d+\|\d+/);
		}
	}
	var downloadedTime = false;
	if($(".no_ignored_command").length)
		$(".no_ignored_command").each(function(i){
			if(x = $(this).html().match("snob.png") && !downloadedTime){ 
				tempo_de_entrada = $(this).find("td:eq(2)").text().match(/\d+/g);
				tempoAtual.setSeconds(tempoAtual.getSeconds()+Number(tempo_de_entrada[2])+(60*Number(tempo_de_entrada[1]))+(3600*Number(tempo_de_entrada[0])));
				downloadedTime = true;
				return;
			}
		});
	var elem = "<div class='vis vis_item' align='center' style='overflow: auto; height: 450px;' id='planer_klinow'><table width='100%'><tr><td width='300'><table style=\"border-spacing: 3px; border-collapse: separate;\"><tr><th>Alvo<th>Data<th>Hora<th>Grupo<th><th><th>CrÃ©ditos/Discord<tr><td><input size=8 type='text' onchange='mostrarDistancia();' value='" + cel +"' id='objetivoCommun' /><td><input size=8 type='text' value='" + formatarDatas(tempoAtual) + "' onchange=\"dataCorreta(this,'.');\" id='data_input'/><td><input size=8 type='text' value='" + formatarHoras(tempoAtual) + "' onchange=\"dataCorreta(this,':');\" id='hora_input'/><td><select id='listGrup' onchange=\"mudarGrupo();\"><option value='"+todasTropas+"'>Todos</select><td onclick=\"mudarSeta(); if($('#escolher_tropas').is(':visible')){ $('#escolher_tropas').hide();$('#lista_tropas').show(); guardarSelecao(); return;}	else{ $('#lista_tropas').hide(); $('#escolher_tropas').show();} \" style=\"cursor:pointer;\"><span id='icone_seta' class='icon header arr_down' ></span><td><input type='button' class='btn' value='CALCULAR' onclick=\"escolherOpcoes();\" id='przycisk'><td>diogorocha18#6499</td></table><td id='carregamento'><img src='"+image_base+"throbber.gif' />";
	elem += "<tr><td colspan=2 width='100%'><table style=\"display: none; border-spacing: 3px; border-collapse: separate;\" id='escolher_tropas' width='100%'></table><table style=\"border-spacing: 3px; border-collapse: separate;\" id='lista_tropas' width='100%'><thead><tr><th id='numero_possibilidades'><span class='icon header village' ></span>";

	for(i=0;i<imagens.length;i++)
		elem += "<th style=\"cursor:pointer;\" class='"+(unidadesAtivas[i]=="0"?"faded":"")+"' onClick=\"if(this.className == 'faded') this.className=''; else this.className='faded';\"><img title='"+info.nomesTropas[i]+"' src='"+img_tropas+"unit_"+imagens[i]+".png'>";
	elem += "<th>Hora de SaÃ­da<th><span class=\'icon header time\'><th><b>Comando</b></thead>";
	elem += "<tbody></table></table></div>";
	$(mobile?"#mobileContent":"#contentContainer").prepend(elem);
}

function dataCorreta(elem,sep){
	x = elem.value.match(/\d+/g);
	elem.value = x[0] + sep + x[1] + sep + x[2];
}

function carregarInfo(){
	carregando = true;
	var r;
	r = new XMLHttpRequest();
	r.open('GET', info.linkTropas, true);
	function processResponse(){
		if (r.readyState == 4 && r.status == 200) {
			requestedBody = document.createElement("body");
			requestedBody.innerHTML = r.responseText;
			var tabela = $(requestedBody).find('#units_table').get()[0];
			
			var grupo = $(requestedBody).find('.vis_item').get()[0].getElementsByTagName(mobile?'option':'a');
			if(!tabela){ $("#carregamento").html("NÃ£o existem aldeias neste grupo..."); carregando = false; return;}
			for(i=1;i<tabela.rows.length;i++){
				mostrarAldeias[i-1]=true;
				tropas[i-1] = [];
				pustaWioska = 0;
				for(j=2;j<tabela.rows[i].cells.length-1;j++){
					tropas[i-1].push(tabela.rows[i].cells[j].textContent);
					if(!Number(tropas[i-1][j-2])) pustaWioska++;
				}
				if(pustaWioska>info.velocidade.length) mostrarAldeias[i-1]=false;
				id.push(tabela.rows[i].cells[0].getElementsByTagName('span')[0].getAttribute("data-id"));
				minhasAldeias.push(tabela.rows[i].cells[0].getElementsByTagName('span')[2].textContent.match(/\d+/g));
				nomesAldeias.push(tabela.rows[i].cells[0].getElementsByTagName('span')[2].textContent);
			}
			selecionarAldeias();
			if(gruposCarregados && $('#lista_tropas').is(':visible')) escolherOpcoes();
			if(!gruposCarregados){
				for(i=0;i<grupo.length;i++){
					nome = grupo[i].textContent;
					if(mobile && grupo[i].textContent=="todos") continue;
					$("#listGrup").append($('<option>', {
						value: grupo[i].getAttribute(mobile?"value":"href")+"&page=-1",
						text: mobile?nome:nome.slice(1,nome.length-1)
					}));
				}
				
				gruposCarregados = true;
			}
			
			$("#carregamento").html("");
			carregando = false;
		};
	}
	r.onreadystatechange = processResponse;
	r.send(null);
}

function formatarDatas(data){
	var dia = (data.getDate()<10) ? ("0"+data.getDate()):(data.getDate());
	var mes = (data.getMonth()+1<10)? ("0"+(data.getMonth()+1)):(data.getMonth()+1);
	return String(dia + "/" + mes + "/" + data.getFullYear());
}

function formatarHoras(data){
	var hora = (data.getHours()<10) ? ("0"+data.getHours()):(data.getHours());
	var minuto = (data.getMinutes()<10) ? ("0"+data.getMinutes()):(data.getMinutes());
	var segundo = (data.getSeconds()<10) ? ("0"+data.getSeconds()):(data.getSeconds());
	return String(hora + ":" + minuto + ":" + segundo);
}

function configuracaoMundo(){
	var dt;
	$.ajax({
		'async':false,
		'url':'/interface.php?func=get_config',
		'dataType':'xml',
		'success':function(data){dt=data;}
	});
	return dt;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toGMTString();
	if(exdays==0) expires="";
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

console.log("Script fixed by Diogo Rocha. Discord: diogorocha18#6499 | Tribal Wars");
