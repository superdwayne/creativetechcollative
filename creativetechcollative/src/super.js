// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jngkkzaivznfcshgqueh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZ2tremFpdnpuZmNzaGdxdWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUzMzM1NDcsImV4cCI6MjAzMDkwOTU0N30.aY485tubOA0gJaO55pXLFLNm1yit7XBQIPZqvsYoNkM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
