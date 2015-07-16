var cp = require("child_process");

module.exports = function(pid, callback) {
  var process_lister, process_lister_command, stderr, stdout;
  process_lister_command = process.platform === "win32" ? "wmic PROCESS GET Name,ProcessId,ParentProcessId,Commandline" : "ps -A -o ppid,pid,comm,command";
  cp.exec(process_lister_command, {
    maxBuffer: 1000*1024
  }, function (error, stdout, stderr) {
    if (error) {
      return callback(new Error("Process `" + process_lister_command + "` exited with code " + error + ":\n" + stderr));
    }
    var children_of, header_keys, headers, i, info, key, output, proc_infos, procs, ref, row, row_values, rows, value;
    rows = stdout.split(/\r?\n|\r/);
    procs = (function() {
      var j, k, len, len1, ref1, results, columns_arr, columns_map;
      results = [];
      for (j = 0, len = rows.length; j < len; j++) {
        row = rows[j]; if (row=='')  continue;
//console.log('row:',row);        
        columns_arr = row.match(/.*?[\t ]{2,}/g);
        if (header_keys==null) {
          if (columns_arr!=null && columns_arr.length>0) {
            header_keys = [];
            columns_arr.every(function(column, i) {
//console.log('  column: ['+column+']');              
              header_keys.push( column.trim() );
              return true;
            });
          }
          //console.log('header_keys:',header_keys); break;
          continue;
        }
//console.log('  columns_arr.length:',(columns_arr!=null)?columns_arr.length:null,' header_keys.length:',header_keys.length);        
        if (columns_arr!=null && columns_arr.length==header_keys.length) {
          columns_map = {};
          columns_arr.every(function(column, i) {
            column = column.trim();            
            key = header_keys[i];
            value = (ref1 = column) != null ? ref1 : "";
//console.log('  key:',key.toLowerCase(),value);
            switch (key.toLowerCase()) {
              case 'processid': case 'pid':
                value = (isNaN(value)==true) ? value : parseFloat(value);
                columns_map.pid = value;
                break;
              case 'parentprocessid': case 'ppid':
                value = (isNaN(value)==true) ? value : parseFloat(value);
//console.log('    ppid:',value);
                columns_map.ppid = value;
                break;
              case 'name': case 'comm':
                columns_map.name = value;
                break;                
              case 'commandline': case 'command':
                columns_map.command = value;
                break;                
              default:
                break;
            }
            //columns_map[key] = value;
            return true;
          });
          results.push(columns_map);
        }
      }
      return results;
    })();

    children_of = function(ppid) {
      var j, len, proc, results;
      results = [];
      for (j = 0, len = procs.length; j < len; j++) {
        proc = procs[j];
        //console.log('proc.ppid:',proc.ppid,' ppid:',ppid,' proc.ppid==ppid?',proc.ppid==ppid);
        if (proc.ppid==null || proc.ppid!=ppid)  continue;
        proc.children = children_of(proc.pid);
        results.push(proc);
      }
      return results;
    };
    return callback(null, children_of(pid));
  });
};
