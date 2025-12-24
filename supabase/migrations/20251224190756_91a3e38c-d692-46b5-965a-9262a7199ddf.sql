-- Enable REPLICA IDENTITY FULL for complete row data in realtime updates
ALTER TABLE whiteboards REPLICA IDENTITY FULL;

-- Add whiteboards table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE whiteboards;