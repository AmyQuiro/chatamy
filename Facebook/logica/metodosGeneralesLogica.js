class metodosGenerales {

    static  getFechaActual(){
        const date = new Date();
        const options = { 
          timeZone: 'America/La_Paz', 
          weekday: 'long', 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit'
        };
        const boliviaDate = date.toLocaleString('es-BO', options);
        console.log(boliviaDate);
        return boliviaDate;
    }

}

module.exports = metodosGenerales;