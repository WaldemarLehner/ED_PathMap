using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO;
using Newtonsoft.Json;
using System.Net;
using System.Data.SQLite;
using System.Globalization;

namespace edsm_to_sql
{
    class Program
    {
        static string path;
        static ulong systemCount = 0;
        //static SQLiteConnection connection;
        [STAThread]
        static void Main(string[] args)
        {
            
            Write(args.Length+"");
            if(args.Length == 0)
            {
                Write("No export directory has been specified as launch parameter. Please pick your export directory now.");
                AskForDestination();
               
            }
            else if(args.Length == 1)
            {
                if (Directory.Exists(args[0]))
                {
                    Clear();
                    Write("The following path has been selected for output: " + args[0]);
                    path = args[0] + "\\systemsWithCoordinates.sqlite";
                    Write("Setting up SQLite Database");
                    CreateSQLite();
                }
            }
            else
            {
                Write("Only one launch parameter can be specified. Please pick your directory now.");
                AskForDestination();
            }



        }
        static void AskForDestination()
        {
            
            FolderBrowserDialog dialog = new FolderBrowserDialog();
            if (dialog.ShowDialog() == DialogResult.OK)
            {

                if (System.IO.Directory.Exists(dialog.SelectedPath))
                {
                    Clear();
                    Write("The following path has been selected for output: " + dialog.SelectedPath);
                    path = dialog.SelectedPath +"\\systemsWithCoordinates.sqlite";
                    Write("Setting up SQLite Database");
                    CreateSQLite();
                }
                else
                {
                    Clear();
                    Write("It seems like there has been an Error. " + dialog.SelectedPath + " could not be choosen. Please retry.");
                    AskForDestination();
                }
            }

        }
        static void CreateSQLite()
        {
            SQLiteConnection.CreateFile("path");
            using (var con = new SQLiteConnection { ConnectionString = "Data Source=" + path + ";Version=3"  })
            {
                con.Open();
                using (var command = new SQLiteCommand { Connection = con })
                {

                    
                    try
                    {
                        command.CommandText = "DROP TABLE IF EXISTS `systems`";
                        command.ExecuteNonQuery();

                    }
                    catch (SQLiteException e)
                    {
                        throw e;
                    }
                }
                using(var command = new SQLiteCommand { Connection = con })
                {
                    try
                    {
                        command.CommandText = "CREATE TABLE systems (name VARCHAR(64) PRIMARY KEY ON CONFLICT REPLACE, x DECIMAL,y DECIMAL,z DECIMAL);";
                        command.ExecuteNonQuery();
                    }
                    catch (SQLiteException e)
                    {
                        throw e;
                    }
                }
                con.Close();
             
                
            }
            
            /*
            //Remove all entries if any exist
            new SQLiteCommand("DROP TABLE IF EXISTS systems",connection).ExecuteNonQuery();
            //Create Table
            new SQLiteCommand("CREATE TABLE systems (name VARCHAR(64), x DECIMAL,y DECIMAL,z DECIMAL)", connection).ExecuteNonQuery();*/
            Download();
        }
        static void Download()
        {

            WebClient webClient = new WebClient();
            String downloadPath = "https://www.edsm.net/dump/systemsWithCoordinates.json";
            Write("Starting download from " + downloadPath);
            //Needs to be read as stream as the file is > 3Gbyte in size and would cause an OutOfMemoryException.
            //Also quicker reading as stream as the conversion into a serialized object is not neccesary.
            using (Stream stream = webClient.OpenRead(downloadPath))
            using (JsonTextReader reader = new JsonTextReader(new StreamReader(stream)))
            {
                List<EDSystem> systemlist = new List<EDSystem>();
                // There's a maximum of 500 INSERT-commands per command.
                /*SkipTo[?] will skip to the next "[?]" in the stream while last[?] indicates that next Read Iteration will have the needed value [?]
                This is because the StreamReader reads like this:
                *
                *   [key]   [value]
                *     X       
                *            10.5
                *     Y 
                *           -1423.2
                *     Z
                *            923.1
                *       [...]
                */
                bool skipToX = false, skipToY = false, skipToZ = false, skipToName = false, lastX = false, lastY = false, lastZ = false, lastName = false;
                string currentSystem = "";
                double currX = double.MaxValue, currY = double.MaxValue, currZ = double.MaxValue;
                
                /* JSON Setup (% indicates a needed value)
                 * 
                 *  root
                 *      >id (int)
                 *      >id64 (int)
                 *      >name (string)      %
                 *      >coords
                 *          x (float)       %
                 *          y (float)       %
                 *          z (float)       %
                 *      >date
                 */

                while (reader.Read())
                {
                    if(reader.Value != null)
                    {
                        if (skipToName || skipToX || skipToY || skipToZ)
                        {
                            switch (reader.Value)
                            {
                                case "name":
                                    //Write("name triggered");
                                    skipToName = false;
                                    lastName = true;
                                    break;
                                case "x":
                                    //Write("x triggered");
                                    skipToX = false;
                                    
                                    lastX = true;
                                    break;
                                case "y":
                                    //Write("y triggered");
                                    skipToY = false;
                                    
                                    lastY = true;
                                    break;
                                case "z":
                                    //Write("z triggered");
                                    skipToZ = false;
                                    lastZ = true;
                                    break;
                            }
                        }
                        else if (Equals(reader.Value, "id")||Equals(reader.Value, "id64")||Equals(reader.Value,"date")) { skipToName = true; }
                        else if (Equals(reader.Value, "coords")) { skipToX = true; }
                        else if(lastName ||lastX || lastY || lastZ)
                        {
                            if (lastName)
                            {
                                currentSystem = (string)reader.Value;
                                lastName = false;
                            }
                            else if (lastX)
                            {
                                currX = Convert.ToDouble(reader.Value);
                                lastX = false;
                                skipToY = true;
                            }
                            else if (lastY)
                            {
                                currY = Convert.ToDouble(reader.Value);
                                lastY = false;
                                skipToZ = true;
                            }
                            else if (lastZ)
                            {
                                currZ = Convert.ToDouble(reader.Value);
                                lastZ = false;
                                systemlist.Add(new EDSystem(currentSystem, currX, currY, currZ));
                                if(systemlist.Count > 450)
                                {
                                    systemCount = systemCount + (ulong)systemlist.Count;
                                    
                                    AddToDB(systemlist);
                                    Write(systemCount + " Systems have been added to the Database by now");
                                    systemlist.Clear();
                                }
                            }
                        }





                    }
                }
                //End of File reached. add remaining entries to db.
                systemCount = systemCount + (ulong)systemlist.Count;
                
                AddToDB(systemlist);
                Write("All Systems have been added to the Database.");
                Wait();

            }


        }
        static string EscapeStringForSQL(string SQLString)
        {
            return SQLString.Replace(@"'", @"''").Replace("\"", "\\\"");
        }







        static void Write(String msg)
        {
            Console.WriteLine(msg);
        }
        static string Read()
        {
            return Console.ReadLine();
        }
        static void Wait()
        {
            Console.ReadKey();
        }
        static void Clear()
        {
            Console.Clear();
        }
        static void AddToDB(List<EDSystem> list)
        {
            NumberFormatInfo nfi = new NumberFormatInfo
            {
                NumberDecimalSeparator = "."
            };
            //Create SQL command to store systems
            StringBuilder commandSB = new StringBuilder().Append("INSERT INTO 'systems' ('name','x','y','z') VALUES ");
            
            foreach (EDSystem system in list)
            {
                 commandSB.Append(string.Format("('{0}',{1},{2},{3}),", EscapeStringForSQL(system.Name), system.Coordinates.X.ToString(nfi), system.Coordinates.Y.ToString(nfi), system.Coordinates.Z.ToString(nfi)));
                //commandSB.Append(string.Format("INSERT INTO `systems` VALUES (`{0}`,`{1}`,`{2}`,`{3}`);", system.Name, system.Coordinates.X.ToString(nfi), system.Coordinates.Y.ToString(nfi), system.Coordinates.Z.ToString(nfi)));
            }
            //Remove "," at the end (set the point one char behind)
            commandSB.Length--;
            //commandSB.Append("COMMIT;");
            using (var con = new SQLiteConnection{  ConnectionString = "Data Source=" + path + ";Version=3" })

            {
                using (var command = new SQLiteCommand { Connection = con })
                {
                    con.Open();
                    command.CommandText = commandSB.ToString();
                    try
                    {
                        command.ExecuteNonQuery();
                    }
                    catch (SQLiteException e)
                    {
                        throw e;
                    }


                }
            }
        }
    }
}
