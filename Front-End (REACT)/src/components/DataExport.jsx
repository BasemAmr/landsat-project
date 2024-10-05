const DataExport = ({ data }) => {
    const downloadCSV = () => {
      const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "landsat_data.csv");
      document.body.appendChild(link);
      link.click();
    };
  
    return (
      <button onClick={downloadCSV}>Download Data as CSV</button>
    );
  };
  
  export default DataExport;
  