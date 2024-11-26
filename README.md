# NetworkDataLakeProxy
Interface towards the NetworkDataLake

### Location
The NetworkDataLakeProxy (NDLP) represents the demarcation towards a higher-layer NetworkDataLake.  

### Description
In principle, the NetworkDataLakeProxy is a fields filtered passthrough of data from the MWDI.  

The following data shall be provided:  
  - Physical inventory (Equipment, Firmware)  
  - Logical inventory (LtpConfiguration, Profiles, Forwarding)  

The following performance criteria shall be kept:  
  - No real-time data required (Information to be taken from MWDI)  
  - Retrieval of the data at least once a day  
  - Throttling accepted:
    - Maximum one ControlConstruct request per second
    - One request to be executed at a time
  - Data integrity according to quality of MWDI content  

### Relevance
The NetworkDataLakeProxy is planned to become the major user interface.  

### Resources
- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

### Comments
./.

