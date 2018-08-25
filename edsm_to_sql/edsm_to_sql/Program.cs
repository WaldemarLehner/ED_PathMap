using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO;
using Newtonsoft.Json;
using System.Data.SQLite;

namespace edsm_to_sql
{
    class Program
    {
        static string path;
        static SQLiteConnection connection;
        static SQLiteCommand command;
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
           
            SQLiteConnection.CreateFile("systemsWithCoordinates.sqlite");
            connection = new SQLiteConnection("Data Source=systemsWithCooesinates.sqlite;Version=3;");
            connection.Open();
            //Remove all entries if any exist
            new SQLiteCommand("DROP TABLE IF EXISTS systems",connection).ExecuteNonQuery();
            //Create Table
            new SQLiteCommand("CREATE TABLE systems (name VARCHAR(64), x DECIMAL,y DECIMAL,z DECIMAL)", connection).ExecuteNonQuery();
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
    }
}
