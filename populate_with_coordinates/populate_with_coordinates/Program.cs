using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;


namespace populate_with_coordinates
{
    class Program
    {
        static List<EDSystem> sysList;
        static string pathDB;
        static string pathLog;
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
                if(!SelectFile("EDSM dump SQLite Database (*.sqlite)", true)){ return; /*Kill program if no success*/ }
                Write("Please select the Log File. Since this is not for production there is no current wait of obtaining said file other than asking the dev for an example file. (please refer to WDX#8000 (discord id) in case you need it.");
                if(!SelectFile("EDSM travel log file (*.json)",false)){ return; /*Kill program if no success */ }
            }
#endregion
            sysList = GenerateSystemList();
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
        static List<EDSystem> GenerateSystemList()
        {

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
