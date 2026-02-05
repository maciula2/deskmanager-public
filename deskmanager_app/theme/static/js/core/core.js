const appState = {
    currentRoom: null, //  Obecnie wyświetlany pokój  //
    userDisplayMode: { //  Ustawienia wyświetlania nazw użytkowników na biurkach  //
        active: false, // Wskaźnik aktywności userDisplayMode // 
        selectedDay: null, // Dzień wg. którego userDisplayMode wyświetla nazwy użytkowników //
    },
    editMode: false // Boolean trybu edycji biurek (nie, zmiana z konsoli nic nie da bez uprawnień superusera) 
}