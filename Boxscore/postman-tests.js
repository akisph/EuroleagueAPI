// Postman Tests για Euroleague Boxscore API
// Βάλε αυτό στο "Tests" tab του Postman request

pm.test("Response status code is 200", function () {
    pm.expect(pm.response.code).to.equal(200);
});

pm.test("Response has valid JSON structure", function () {
    const jsonData = pm.response.json();
    
    // Basic structure validation
    pm.expect(jsonData).to.have.property('Live');
    pm.expect(jsonData).to.have.property('ByQuarter');
    pm.expect(jsonData).to.have.property('EndOfQuarter');
    pm.expect(jsonData).to.have.property('Stats');
});

pm.test("Live field is boolean", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.Live).to.be.a('boolean');
});

pm.test("ByQuarter has exactly 2 teams", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.ByQuarter).to.be.an('array');
    pm.expect(jsonData.ByQuarter).to.have.lengthOf(2);
});

pm.test("EndOfQuarter has exactly 2 teams", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.EndOfQuarter).to.be.an('array');
    pm.expect(jsonData.EndOfQuarter).to.have.lengthOf(2);
});

pm.test("Stats has exactly 2 teams", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.Stats).to.be.an('array');
    pm.expect(jsonData.Stats).to.have.lengthOf(2);
});

pm.test("Each team has required quarter data", function () {
    const jsonData = pm.response.json();
    
    jsonData.ByQuarter.forEach(team => {
        pm.expect(team).to.have.property('Team');
        pm.expect(team).to.have.property('Quarter1');
        pm.expect(team).to.have.property('Quarter2');
        pm.expect(team).to.have.property('Quarter3');
        pm.expect(team).to.have.property('Quarter4');
        
        pm.expect(team.Quarter1).to.be.a('number');
        pm.expect(team.Quarter2).to.be.a('number');
        pm.expect(team.Quarter3).to.be.a('number');
        pm.expect(team.Quarter4).to.be.a('number');
    });
});

pm.test("Player stats validation", function () {
    const jsonData = pm.response.json();
    
    jsonData.Stats.forEach(teamStats => {
        pm.expect(teamStats).to.have.property('Team');
        pm.expect(teamStats).to.have.property('Coach');
        pm.expect(teamStats).to.have.property('PlayersStats');
        pm.expect(teamStats).to.have.property('tmr');
        pm.expect(teamStats).to.have.property('totr');
        
        // Validate each player
        teamStats.PlayersStats.forEach(player => {
            pm.expect(player).to.have.property('Player_ID');
            pm.expect(player).to.have.property('Player');
            pm.expect(player).to.have.property('Points');
            pm.expect(player).to.have.property('Minutes');
            
            // Player_ID format validation
            pm.expect(player.Player_ID).to.match(/^P\d{6}\s*$/);
            
            // Points should be non-negative
            pm.expect(player.Points).to.be.at.least(0);
            
            // Minutes validation
            if (player.Minutes !== null && player.Minutes !== "DNP") {
                pm.expect(player.Minutes).to.match(/^\d{1,2}:\d{2}$/);
            }
        });
    });
});

pm.test("Team totals validation", function () {
    const jsonData = pm.response.json();
    
    jsonData.Stats.forEach(teamStats => {
        const totals = teamStats.totr;
        
        pm.expect(totals.Minutes).to.equal("200:00");
        pm.expect(totals.Points).to.be.a('number').and.be.at.least(0);
        pm.expect(totals.TotalRebounds).to.be.a('number').and.be.at.least(0);
        pm.expect(totals.Assistances).to.be.a('number').and.be.at.least(0);
    });
});

// Αποθήκευση δεδομένων για άλλα tests
pm.globals.set("last_boxscore_data", JSON.stringify(pm.response.json()));

console.log("✅ Όλα τα Euroleague Boxscore validation tests πέρασαν!");
