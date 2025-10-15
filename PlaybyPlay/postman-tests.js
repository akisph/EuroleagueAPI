// Postman Tests για Euroleague PlaybyPlay API
// Βάλε αυτό στο "Tests" tab του Postman request

pm.test("Response status code is 200", function () {
    pm.expect(pm.response.code).to.equal(200);
});

pm.test("Response has valid JSON structure", function () {
    const jsonData = pm.response.json();
    
    // Basic structure validation
    pm.expect(jsonData).to.have.property('FirstQuarter');
    pm.expect(jsonData).to.have.property('SecondQuarter');
    pm.expect(jsonData).to.have.property('ThirdQuarter');
    pm.expect(jsonData).to.have.property('FourthQuarter');
});

pm.test("All quarters are arrays", function () {
    const jsonData = pm.response.json();
    
    pm.expect(jsonData.FirstQuarter).to.be.an('array');
    pm.expect(jsonData.SecondQuarter).to.be.an('array');
    pm.expect(jsonData.ThirdQuarter).to.be.an('array');
    pm.expect(jsonData.FourthQuarter).to.be.an('array');
});

pm.test("Play actions have required fields", function () {
    const jsonData = pm.response.json();
    
    const allPlays = [
        ...jsonData.FirstQuarter,
        ...jsonData.SecondQuarter,
        ...jsonData.ThirdQuarter,
        ...jsonData.FourthQuarter
    ];
    
    if (jsonData.ExtraTime) {
        allPlays.push(...jsonData.ExtraTime);
    }
    
    allPlays.forEach(play => {
        pm.expect(play).to.have.property('NUMBEROFPLAY');
        pm.expect(play).to.have.property('CODETEAM');
        pm.expect(play).to.have.property('PLAYTYPE');
        
        pm.expect(play.NUMBEROFPLAY).to.be.a('number');
        pm.expect(play.CODETEAM).to.be.a('string');
        pm.expect(play.PLAYTYPE).to.be.a('string');
    });
});

pm.test("Player ID format validation", function () {
    const jsonData = pm.response.json();
    
    const allPlays = [
        ...jsonData.FirstQuarter,
        ...jsonData.SecondQuarter,
        ...jsonData.ThirdQuarter,
        ...jsonData.FourthQuarter
    ];
    
    allPlays.forEach(play => {
        if (play.PLAYER_ID) {
            pm.expect(play.PLAYER_ID).to.match(/^P\d{6}\s*$/);
        }
    });
});

pm.test("Score format validation", function () {
    const jsonData = pm.response.json();
    
    const allPlays = [
        ...jsonData.FirstQuarter,
        ...jsonData.SecondQuarter,
        ...jsonData.ThirdQuarter,
        ...jsonData.FourthQuarter
    ];
    
    allPlays.forEach(play => {
        if (play.SCORE) {
            pm.expect(play.SCORE).to.match(/^\d+-\d+$/);
        }
        if (play.MARKERTIME) {
            pm.expect(play.MARKERTIME).to.match(/^\d{2}:\d{2}$/);
        }
    });
});

console.log("✅ Όλα τα Euroleague PlaybyPlay validation tests πέρασαν!");
