using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;
using Newtonsoft.Json;
using System.Data.SQLite;
using Newtonsoft.Json.Linq;

namespace populate_with_coordinates
{
   
    class Program
    {
        static List<EDSystem> sysList;
        static string exportJson;
        static string pathDB;
        static string pathLog;
        static string pathOutput;
        [STAThread]
        static void Main(string[] args)
        {
#region SETUP
            if(args.Length > 0)
            {
                //TODO: handle args;
            }
            else
            {
                Write("Please select the SQLite Database containing the EDSM system dump. You can generate said file using edsm_to_sql.exe");
                if(!SelectFile("SQLite Database(*.sqlite)|*.sqlite", true)){ return; /*Kill program if no success*/ }
                Write("Please select the Log File. Since this is not for production there is no current wait of obtaining said file other than asking the dev for an example file. (please refer to WDX#8000 (discord id) in case you need it.");
                if(!SelectFile("EDSM Travel Log(*.json)|*json", false)){ return; /*Kill program if no success */ }
                Write("Please select an output directory.");
                SelectOutputPath();

            }
#endregion

            sysList = GenerateSystemList();
            Write("Serializing Systemlist.");
            exportJson = JsonConvert.SerializeObject(sysList, Formatting.None);
            SaveFile("requiredSystems.json", exportJson, pathOutput);
            Write("Successfully generated requiredSystems.json at " + pathOutput);
            Wait();
        }


        static void SaveFile(string filename, string data, string path)
        {
            try
            {
                var directory = String.Format("{0}\\{1}", path, filename);
                System.IO.File.WriteAllText(directory, data);
            }
            catch(Exception e)
            {
                Write("Something went wrong when trying to export the file: " + e.Message);
                Wait();
                throw e;
            }
        }
        static bool SelectFile(string filter,bool isDataBase)
        {
            bool success;
            OpenFileDialog opf = new OpenFileDialog
            {
                Filter = filter
            };
            if (opf.ShowDialog() == DialogResult.OK)
            {
                if (isDataBase)
                {
                    pathDB = opf.FileName;
                    if (File.Exists(pathDB))
                    {
                        Write("Successfully targeted SQLite DB.");
                        success = true;
                    }
                    else
                    {
                        Write("Targeting file was successful but no file was found at given URI.");
                        success = false;
                    }
                }
                else
                {
                    pathLog = opf.FileName;
                    if (File.Exists(pathLog))
                    {
                        Write("Successfully targeted Travel Log.");
                        success = true;
                    }
                    else
                    {
                        Write("Targeting file was successful but no file was found at given URI.");
                        success = false;
                    }
                }
            }
            else
            {
                Write("There has been an error. Could not pass said file. Please restart the program.");
                Wait();
                success = false;
            }
            return success;

        }
        static void SelectOutputPath()
        {
            FolderBrowserDialog dialog = new FolderBrowserDialog();
            if(dialog.ShowDialog() == DialogResult.OK)
            {
                if (Directory.Exists(dialog.SelectedPath))
                {
                    Write("Successfully pointed at output directory.");
                    pathOutput = dialog.SelectedPath;
                }
                else
                {
                    Write("Oh no. It seems like something went wrong. retrying.");
                    SelectOutputPath();
                }
            }
        }
        static List<EDSystem> GenerateSystemList()
        {
            Write("Getting required System Data.");
            List<EDSystem> _sysList = new List<EDSystem>() ;
            List<string> systemnames = new List<string>();
            string jsonSerialized = String.Empty;
            try
            {
               jsonSerialized = File.ReadAllText(pathLog);
            }
            catch(Exception e)
            {
                Write("Could not read given file. ErrorMessage:" + e.Message);
                Wait();
                Application.Exit();
            }
            JObject JJson = JObject.Parse(jsonSerialized);
            IList<JToken> systems = JJson["logs"].Children().ToList();
            foreach (JToken result in systems)
            {
                systemnames.Add(result["system"].ToString());
            }
            //remove Dupes
            systemnames = systemnames.Distinct().ToList();


            //Prepare SQLite query.
            //Build SQL command
            Write("Preparing SQLite Command");
            StringBuilder cmdBuilder = new StringBuilder().Append("SELECT name,x,y,z FROM systems WHERE name IN (");
            foreach(string system in systemnames)
            {
                cmdBuilder.Append(String.Format("\"{0}\",", system.Replace("'","''")));
            }
            //turn out of "_systemName_," → "_systemName_)"
            cmdBuilder.Length--;
            cmdBuilder.Append(")");
            using (var con = new SQLiteConnection { ConnectionString = "Data Source=" + pathDB + ";Version=3" })
            {
                try
                {
                    con.Open();
                    using (var cmd = new SQLiteCommand { Connection = con, CommandText = cmdBuilder.ToString() })
                    {
                        try
                        {
                            Write("Executing command.");
                            SQLiteDataReader dataReader = cmd.ExecuteReader();
                            while (dataReader.Read())
                            {
                                _sysList.Add(new EDSystem(dataReader.GetString(0), dataReader.GetDouble(1), dataReader.GetDouble(2), dataReader.GetDouble(3)));
                            }
                        }
                        catch (Exception e)
                        {
                            Write("Something went wrong: " + e.Message);
                            Wait();
                            throw e;
                        }
                    }
                }
                catch (Exception e)
                {
                    Write("Could not instantiate SQLite connection: " + e.Message);
                    Wait();
                    throw e;

                }

            }


            return _sysList;
        }

#region Console Commands
        static void Write(string msg)
        {
            Console.WriteLine(msg);
        }
        static string Read()
        {
            return Console.ReadLine();
        }
        static void Clear()
        {
            Console.Clear();
        }
        static void Wait()
        {
            Console.ReadKey();
        }
#endregion




    }
}
