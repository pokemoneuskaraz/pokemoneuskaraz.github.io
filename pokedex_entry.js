showApiInformation();
async function showApiInformation(){
    // First get the pokeapi data given a name
    var pokemonName = sessionStorage.getItem("selectedPokemon");
    var pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
    var response = await fetch(pokemonUrl);
    var pokemonJson = await response.json();
    console.log(pokemonJson);

    // Set english name
    const nameEnglish = document.getElementById("nameEnglish").innerHTML = pokemonName.replace(/^./, str => str.toUpperCase());

    // Set weight and height
    var weight = pokemonJson.weight;
    var height = pokemonJson.height;
    const weightVal = document.getElementById("weightVal").innerHTML = weight/10 + " kg";
    const heightVal = document.getElementById("heightVal").innerHTML = height/10 + " m";

    // Set basque name
    fetch('pokedex.ods')
    .then(res => res.arrayBuffer())
    .then(buffer => {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets["izenak"];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        var id = pokemonJson.id;
        let basqueName = data[id-1][1];
        
        for (let row of data) {
            if (row[2] && row[2].toString().toLowerCase() === pokemonName.toLowerCase()) {
                const nameBasque = document.getElementById("nameBasque").innerHTML = row[1].replace(/^./, str => str.toUpperCase());
                break;
            }
        }

        // Set ID, previous, next pokemon
        const pokemonId = document.getElementById("pokemonId").innerHTML = id;
        if(id > 1){
            let prevBasqueName = data[id-2][1];
            const prevPokemonId = document.getElementById("prevPokemonId").innerHTML = `< ${prevBasqueName}`;
        } else {
            const prevPokemonId = document.getElementById("prevPokemonId").innerHTML = "";
        }
        if(id < 649){ // Genesect
            let nextBasqueName = data[id][1];
            const nextPokemonId = document.getElementById("nextPokemonId").innerHTML = `${nextBasqueName} >`;
        } else {
            const nextPokemonId = document.getElementById("nextPokemonId").innerHTML = "";
        }
    });
    
    // set typing
    var types = pokemonJson.types.map(item=>item.type.name);
    fetch('itzulpenak.ods')
    .then(res => res.arrayBuffer())
    .then(buffer => {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets["Motak"];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let typesBasque = types.map(type => {
            const row = data.find(r => r[2] && r[2].toString().toLowerCase() === type.toLowerCase());
            return row ? row[0] : type;
        });
        const typesComponent = document.getElementById("types");
        if(typesBasque.length > 1){
            typesComponent.classList.add("grid-cols-2")
            typesComponent.innerHTML = `<span class="flex-1 flex items-center justify-center ${types[0]}"><img src="type_icons/${types[0]}.png" width=38><h3 class="text-xl px-2 py-1 text-center text-white">${typesBasque[0]}a</h3></span>`
            typesComponent.innerHTML += `<span class="flex-1 flex items-center justify-center rounded-r-xl ${types[1]}"><img src="type_icons/${types[1]}.png" width=38><h3 class="text-xl px-2 py-1 text-center text-white ${types[1]}">${typesBasque[1]}a</h3></span>`
        } else {
            typesComponent.innerHTML = `<span class="flex-1 flex items-center justify-center rounded-r-xl ${types[0]}"><img src="type_icons/${types[0]}.png" width=38><h3 class="text-xl px-2 py-1 text-center text-white ${types[0]}">${typesBasque[0]}a</h3></span>`
        }
    });

    // Set abilities TODO
    var abilities = pokemonJson.abilities;

    // Set stats
    var stats = pokemonJson.stats.map(item=>item.base_stat);
    calculateAllStats(stats);
    
    // Set image
    var image = pokemonJson.sprites.other['official-artwork'].front_default;
    const mainImage = document.getElementById("mainImage");
    mainImage.src = image;

    // Set cry
    var cry = pokemonJson.cries.latest;
    const audioSource = document.getElementById("pokemonAudioSource");
    const audioPlayer = document.getElementById("pokemonAudio");
    audioSource.src = cry;
    audioPlayer.load();

    // Set images
    var images = pokemonJson.sprites.versions;
    var genIndex = 1;
    Object.entries(images).forEach(([generation, games]) => {
        const htmlElement = document.getElementById(`iconGen${genIndex}`);
        Object.entries(games).forEach(([game, sprite]) => {
            var front_default = sprite.front_default ? sprite.front_default : false;
            var back_default = sprite.back_default ? sprite.back_default : false;
            var front_shiny = sprite.front_shiny ? sprite.front_shiny : false;
            var back_shiny = sprite.back_shiny ? sprite.back_shiny : false;
            const gameBlock = document.createElement("div");
            gameBlock.className = "grid grid-cols-1 py-2 px-4 m-4 rounded-xl bg-opacity-20 bg-gray-200";

            const gameTitle = document.createElement("p");
            gameTitle.className = "text-white text-sm p-2 text-center"
            gameTitle.textContent = game;
            gameBlock.appendChild(gameTitle);

            const gameIcons = document.createElement("div");
            gameIcons.className = "flex";

            if(front_default) gameIcons.appendChild(createImgBlock(front_default, "Aurretik"));
            if(back_default) gameIcons.appendChild(createImgBlock(back_default, "Atzetik"));
            if (front_shiny) gameIcons.appendChild(createImgBlock(front_shiny, "Aurretik (shiny)"));
            if(back_shiny) gameIcons.appendChild(createImgBlock(back_shiny, "Atzetik (shiny)"));
            
            gameBlock.appendChild(gameIcons);
            htmlElement.appendChild(gameBlock);
        });
        genIndex++;
    });
    setToggles();
}

function createImgBlock(src, text){
    const imageCont = document.createElement("div");
    imageCont.className = "grid grid-cols-1 p-4";
    const frontImg = document.createElement("img");
    frontImg.src = src;
    frontImg.className = "mx-auto";
    const frontTitle = document.createElement("p");
    frontTitle.className = "text-sm text-white text-center my-2"
    frontTitle.textContent = text;
    imageCont.appendChild(frontImg);
    imageCont.appendChild(frontTitle);
    return imageCont;
}

function calculateStat(baseStat, isPS){
    if(isPS){
        let min50  = Math.floor((2 * baseStat + 0 + Math.floor(0/4)) * 50 / 100) + 50 + 10;
        let min100 = Math.floor((2 * baseStat + 0 + Math.floor(0/4)) * 100 / 100) + 100 + 10;
        let max50  = Math.floor((2 * baseStat + 31 + Math.floor(252/4)) * 50 / 100) + 50 + 10;
        let max100 = Math.floor((2 * baseStat + 31 + Math.floor(252/4)) * 100 / 100) + 100 + 10;
        return [min50, max50, min100, max100]
    } else {
        let min50  = Math.floor(Math.floor((2 * baseStat + 0 + Math.floor(0/4)) * 50 / 100 + 5) * 0.9);
        let min100 = Math.floor(Math.floor((2 * baseStat + 0 + Math.floor(0/4)) * 100 / 100 + 5) * 0.9);
        let max50  = Math.floor(Math.floor((2 * baseStat + 31 + Math.floor(252/4)) * 50 / 100 + 5) * 1.1);
        let max100 = Math.floor(Math.floor((2 * baseStat + 31 + Math.floor(252/4)) * 100 / 100 + 5) * 1.1);
        return [min50, max50, min100, max100]
    }
}

function calculateAllStats(baseStats) {
    for (var j = 0; j<baseStats.length; j++){
        statCounter = 0
        var stat = calculateStat(baseStats[j], j == 0);
        var statRow = document.getElementById(`statRow${j}`).children;
        statRow[1].innerHTML = baseStats[j];
        for (var i = 2; i < statRow.length; i++) {
            statRow[i].innerHTML = stat[statCounter];
            statCounter++;
        }
    }
}

function setToggles(){
    document.getElementById("toggleEstatistikak").addEventListener("click", () => {
    document.getElementById("toggleEstatistikak").textContent == "⌄ Erakutsi" ?
    document.getElementById("toggleEstatistikak").textContent = "⌃ Ezkutatu" : 
    document.getElementById("toggleEstatistikak").textContent = "⌄ Erakutsi" ;
    const section = document.getElementById("estatistikakContent");
    section.classList.toggle("hidden");
    });

    document.getElementById("toggleDeskribapenak").addEventListener("click", () => {
    document.getElementById("toggleDeskribapenak").textContent == "⌄ Erakutsi" ?
    document.getElementById("toggleDeskribapenak").textContent = "⌃ Ezkutatu" : 
    document.getElementById("toggleDeskribapenak").textContent = "⌄ Erakutsi" ;
    const section = document.getElementById("deskribapenakContent");
    section.classList.toggle("hidden");
    });

    document.getElementById("toggleErasoak").addEventListener("click", () => {
    document.getElementById("toggleErasoak").textContent == "⌄ Erakutsi" ?
    document.getElementById("toggleErasoak").textContent = "⌃ Ezkutatu" : 
    document.getElementById("toggleErasoak").textContent = "⌄ Erakutsi" ;
    const section = document.getElementById("erasoakContent");
    section.classList.toggle("hidden");
    });

    document.getElementById("toggleEboluzioa").addEventListener("click", () => {
    document.getElementById("toggleEboluzioa").textContent == "⌄ Erakutsi" ?
    document.getElementById("toggleEboluzioa").textContent = "⌃ Ezkutatu" : 
    document.getElementById("toggleEboluzioa").textContent = "⌄ Erakutsi" ;
    const section = document.getElementById("eboluzioaContent");
    section.classList.toggle("hidden");
    });

    document.getElementById("toggleItxura").addEventListener("click", () => {
    document.getElementById("toggleItxura").textContent == "⌄ Erakutsi" ?
    document.getElementById("toggleItxura").textContent = "⌃ Ezkutatu" : 
    document.getElementById("toggleItxura").textContent = "⌄ Erakutsi" ;
    const section = document.getElementById("itxuraContent");
    section.classList.toggle("hidden");
    });

}
