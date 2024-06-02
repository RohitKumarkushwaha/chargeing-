class RPCStationService{
    static stations = new Map();

    static addStation(station) {
        this.stations.set(parseInt(station.identity), station);
    }
    
    //deve prendere in ingresso idTag (id Utente)
    static async remoteStartTransaction(stationId, IdTag){
        try{
            const response = await this.stations.get(stationId).call('RemoteStartTransaction', {
                idTag: IdTag + ""
            });
            return response.status === "Accepted";   
        }catch(e){
            console.log(e);
            return false;
        }
    }
    
    static async remoteStopTransaction(stationId, transactionId){
        try{
            const response = await this.stations.get(stationId).call('RemoteStopTransaction', {
                transactionId: transactionId
            });
            return response.status === 'Accepted';   
        }catch(e){
            console.log(e);
            return false;
        }
        
    }
    
    static async reserveNow(stationId, transactionId, userId, expiryDate){
        try{
            const response = await this.stations.get(stationId).call('ReserveNow', {
                connectorId: 0,
                expiryDate: expiryDate.toISOString(),
                idTag: userId + "",
                reservationId: transactionId
            });
            return response.status === 'Accepted';
        }catch(e){
            console.log(e);
            return false;
        }
    }
    
    static async cancelReservation(stationId, transactionId){
        try{
            const response = await this.stations.get(stationId).call('CancelReservation', {
                reservationId: transactionId
            });
            return response.status === 'Accepted';
        }catch(e){
            console.log(e);
            return false;
        }
    }
    
}

module.exports = RPCStationService;